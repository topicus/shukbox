include_facebook();
Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');
Requests = new Meteor.Collection('requests');
LatestLists = new Meteor.Collection("latestlists");
profiles = new Meteor.Collection("profiles");

Session.set('listkey', null);
Session.set('playchannel', null);
Session.set('fulluser', null);
Session.set('owner', null);
Session.set('edited', null);
Session.set('synced', null);
Session.set('repeat', true);
Session.set('current', null);
Session.set('page', null);
Session.set('profile', null);

Meteor.autosubscribe(function () {
    Meteor.subscribe('songs',Session.get('listkey'));
    Meteor.subscribe('playchannels', Session.get('playchannel'));
    Meteor.subscribe('playlists', Session.get('listkey'));
    Meteor.subscribe('latestlists');
    
});

var CONTROL_KEYCODES = new Array(40,38,37,39)
var ENTER = 13;
var ESC = 27;
var AUTOCOMPLETE_PAGE_SIZE = 5;
var currentSelected = -1;


var player;
var current = 0;
var old_current = -1;
var weight = 1000;  
var tag = document.createElement('script');
var login_interval;
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var playManager = new PlaylistManager();
var userManager = new UserManager();
var controls = new Controls();

init();
function init(){
  Backbone.history.start({pushState: true});
  if(Meteor.user() === null) 
    userManager.loginAsAnonym();
  userManager.getFullUser();
}
Template.shares.playlist_url = function(){
  return window.location.protocol+'//'+window.location.host+"/?listkey="+Session.get('listkey');
}
Template.shares.playchannel_url = function(){
  if(typeof Session.get('playchannel')==="undefined")
    return false;
  else
    return window.location.protocol+'//'+window.location.host+"/"+Session.get('playchannel');
};
Template.shares.on_playchannel_ready = function(){  
  if(typeof(FB)!=='undefined'){
    Meteor.flush();
    Meteor.defer(function(){
      FB.XFBML.parse();    
    });
  }
};
Template.shares.events = {
  'click #playlist_url': function(e){
    Meteor.flush();
    $(e.target).select();
  },
  'click #playchannel_url': function(e){
    Meteor.flush();
    $(e.target).select();  
  },
  'click .qrcode':function(e){
    Meteor.flush();
    $('.qr-wrap').slideToggle('medium'); 
  }
};
Template.playlists.mylists = function(){
  return PlayLists.find({user:Meteor.user()._id, saved:true},{sort: {when: -1}})
};
Template.playlist.is_current = function(){
  if(Session.equals('listkey', this._id)){
    return 'active';
  }
  return '';
};
Template.playlists.events = {
  'click li':function(e){
    controls.stopVideo();
    playManager.setList(this._id);
    Meteor.flush();
    $('.reseteable').button('toggle');
  },
  'click .create':function(){
    Meteor.flush();
    playManager.newList(true);
    Meteor.defer(function(){
      $('#save-control').show();
      $('#listname').select();         
    }); 
  },
  'click .cancel-edit-list':function(e){
    Meteor.flush();
    $('#save-control').hide();
  },
  'click .update':function(e){
    Meteor.flush();
    $('.savelist').html('Save');
    $('#save-control').show();
    $('#listname').select();
  },
  'click .savelist':function(){   
    $('#save-control').hide();    
    savelist();
  },
  'keydown #save-control input':function(e){
    if(e.which===13){
      $('#save-control').hide();      
      savelist();
    }
  },
  'click .edit-button':function(e){
    $('#save-control').show();
    $('#listname').val(this.name);
    $('#listname').select();
    $('.savelist').html('Edit');
    Session.set('edited', this._id);
    return false;
  },
  'click .delete': function () {
    Meteor.flush();
    setModalMessage("Delete playlist?", "Do you want to delete the Playlist "+this.name+"?")
    var that = this;
    $('#alert-window').modal('show');
    $('#alert-window .confirm').on('click', function () {
      deleteList(that);
      $('#alert-window').modal('hide');
    }); 
    $('#alert-window .discard').on('click', function () {
      $('#alert-window').modal('hide');
    });        
    return false;
  }
};
Template.search.events = {
  'focusin input.nextsong':function(e){
    addInputEvent();
  },
  'focusout input.nextsong':function(e){
    removeInputEvent();
  },  
  'keydown input.nextsong':function(e){
    if(jQuery.inArray(e.which, CONTROL_KEYCODES)!=-1){
      autocompleter = $('#autocompleter li');
      old = currentSelected;
      
      if(currentSelected==autocompleter.length-1 && e.which == 40){
        currentSelected = 0;
      }else if(!currentSelected && e.which == 38){
        currentSelected = autocompleter.length-1;
      }else{
        if(e.which == 40)
          currentSelected++;
        else if(e.which ==38)
          currentSelected--;
      }
      if(old!=-1) $('#autocompleter li').eq(old).removeClass('selected')
      $('#autocompleter li').eq(currentSelected).addClass('selected')
    }
    if(e.which==ENTER){
      if(currentSelected==autocompleter.length-1){
        autocomple_offset +=AUTOCOMPLETE_PAGE_SIZE;
        search(document.getElementById('nextsong').value, AUTOCOMPLETE_PAGE_SIZE);        
        currentSelected=-1;
        $('#autocompleter li.selected span').html('Loading...');
      }    
      if(currentSelected!==-1) addSong($('#autocompleter li').eq(currentSelected));
    }
    if(e.which==ESC){
      currentSelected = -1;
      autocomple_offset = 1;
      $("#autocompleter").hide();    
    }
  }  
};
Template.musiclist.songs = function () {
  if(typeof(Session.get('playchannel'))=== "undefined"){
    playManager.newChannel();
    return Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}});
  }else{
    return Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch();
  }
  return false;
};
Template.musiclist.events = {
  'click .vote': function (e) {
    var vote = Songs.find({_id:this._id, voters:{$in:[Meteor.user()._id]}}).count();
    if(!vote)
      Songs.update({_id: this._id},{$inc:{score:1}, $push:{voters:Meteor.user()._id}});
    return false;
  },
  'click .delete': function (e) { 
    var pco = PlayChannels.findOne({_id:Session.get('playchannel')});
    var so = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[pco.current];
    if(so._id === this._id){
      controls.stopVideo();      
      controls.setCurrent('modify', -1);
      controls.nextSong();
    }else{
      Songs.remove(this._id);
    }
    return false;
  },
  'click .subactions': function(e){
    e.stopPropagation();
  },
  'click li': function (e) {
    playManager.newChannel();
    var s = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch(); 
    for(k=0,l=s.length;k<l;k++){
      if(s[k]._id == this._id){
        controls.setCurrent('set',k);
        controls.playSong(s[k].name);
      }
    }
  }  
};
Template.song.is_current = function(){
    var pco = PlayChannels.findOne({_id:Session.get('playchannel')});
    if(pco){
      var so = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[pco.current];
      if(typeof(so) !== 'undefined' && so._id===this._id){
        if(Session.get('synced')){
          Meteor.flush();
          Meteor.defer(function(){
            controls.playSong(so.name);
          });
        }
        return ' current'; 
      }
    }

    return '';
};
Template.modifiers.on_modifiers_loaded = function () {
  Meteor.defer(function () {
    $('.tooltip').hide();
    $('.tip').tooltip({animation:true,placement:'bottom'});
  });
  return "";
};
Template.modifiers.blocked = function(){
  var plo = PlayLists.findOne({_id:Session.get('listkey')});
  if(typeof(plo) !=='undefined'){
    var blocked = (typeof(plo.blocked)==='undefined')? false:(!plo.blocked)? false : true;  
    return (plo.blocked)? 'active' : '';
  }
  return '';
};
Template.modifiers.synced = function(){
  return (Session.get('synced'))? 'active' : '';
};
Template.modifiers.repeated = function(){
  return (Session.get('repeat'))? 'active' : '';
};
Template.modifiers.events = {
  'click .playsong': function () {    
    c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[0];          
    if(typeof c !== "undefined"){
      playManager.newChannel();
      controls.setCurrent('set',0);
      controls.playSong(c.name);
    }
  },
  'click .clearlist': function () {         
    Songs.remove({listkey:Session.get('listkey')});
  },      
  'click .skip': function () {
    controls.nextSong();
  },
  'click .share-button':function(e){
    Meteor.flush(); 
    $('#shares').slideToggle('medium',function(){
      $('#playchannel_url').select();
    });
    
    Meteor.defer(function(){
      FB.XFBML.parse();    
    }); 
  },
  'click .block': function (e) {
    var pl = PlayLists.find({_id:Session.get('listkey')})
    if(pl.count()){
      var plo = pl.fetch()[0];
      var blocked = false;
      if(!plo.blocked || typeof(plo.blocked) === 'undefined') blocked = true;      
      PlayLists.update({_id:Session.get('listkey')}, {$set:{blocked:blocked}});
    }
  },
  'click .sync': function (e) {
    Session.set('synced', !Session.get('synced'));
  },
  'click .repeat-button': function (e) {
    Session.set('repeat', !Session.get('repeat'));
  }    
};
Template.navbar.profile_image_url = function(){
  var f = Session.get('fulluser');
  if(f){
    var s = f.services;
    var service_id = (s.facebook) ? "http://graph.facebook.com/"+s.facebook.id+"/picture" : (s.google) ? "https://plus.google.com/s2/photos/profile/"+s.google.id+"?sz=30" : false;
    return service_id;
  }else{
    return '';
  }  
};

function deleteList(t){
    Session.set('listkey', undefined);
    PlayLists.remove(t._id);
    playManager.newList();
};
function savelist(e) {
  Meteor.flush();
  var plo = PlayLists.findOne({_id:Session.get('listkey')});
  if(plo.user === Meteor.user()._id){
    var l = (Session.get('edited')) ? Session.get('edited') : Session.get('listkey');
    PlayLists.update({_id:l}, { $set:{name:$('#listname').val(), saved:true} });
    Session.set('edited', null);
  }else{
    delete plo._id;
    delete plo.name;
    plo.user = Meteor.user()._id;
    plo.saved = true;
    plo.name = $('#listname').val();
    Meteor.call('addPlaylist', plo, function(error,response){
      Songs.find({listkey:Session.get('listkey')}).forEach(function(item){      
        delete item._id;
        item.listkey = response;
        Songs.insert(item);
      });  
    });
    
  }
}
function addSong(jselector){
  Meteor.flush();
  var vid = get_youtube_id(jselector.children('a').attr("href"));
  var title = jselector.children('a').attr("title");
  var user_logged = Session.get('fulluser');
  var fbid = (user_logged.services.facebook) ? user_logged.services.facebook.id : false;
  var goid = (user_logged.services.google) ? user_logged.services.google.id : false;
  var so = Songs.findOne({listkey:Session.get('listkey')},{sort: {weight: -1}});
  
  if(typeof(so)!=='undefined'){
    var last_weight = (!so.weight || typeof(so.weight) ==='undefined')? 0:so.weight+1;
  }
  var song = {
    name: vid,
    fbid:fbid,
    goid:goid,
    score: 0,
    title:title,
    listkey:Session.get('listkey'),
    added_by:Meteor.user()._id,
    weight:last_weight
  };
  Meteor.call('addSong', song);
  $("#autocompleter").hide();
  currentSelected = -1;
  $('.nextsong').val('');  
}
function setModalMessage(title, body){
  $('.modal-header h3').html(title);
  $('.modal-body p').html(body);
}


/*HELPERS HANDLEBARS*/
if (window.Handlebars) {
  Handlebars.registerHelper("signedup", function() {
    var u = Meteor.user();
    if(u && typeof(u.anonym) !=='undefined')
      return null;
    return Meteor.user();  
  });
  Handlebars.registerHelper('owner', function(){
    if(Meteor.user())
      return Session.get('owner') === Meteor.user()._id;
    return false;
  }); 
  Handlebars.registerHelper('page_is', function(page){
    console.log(Session.get('page'));
    return Session.get('page') === page;
  });   
}
/*END HANDLEBARS HELPER*/


