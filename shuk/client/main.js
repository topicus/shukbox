include_facebook();
Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');
Requests = new Meteor.Collection('requests');

Session.set('listkey', null);
Session.set('playchannel', null);
Session.set('synced', null);
Session.set('repeat', null);
Session.set('fulluser', null);
Session.set('owner', null);
Session.set('edited', null);

Meteor.autosubscribe(function () {
    Meteor.subscribe('songs',Session.get('listkey'));
    Meteor.subscribe('playchannels', Session.get('playchannel'));
    Meteor.subscribe('playlists', Session.get('listkey'));
  
});

/*
var insertedNodes = [];
document.addEventListener("DOMNodeInserted", function(e) {
 console.log(e.target);
}, false);
*/
var CONTROL_KEYCODES = new Array(40,38,37,39)
var ENTER = 13;
var ESC = 27;
var AUTOCOMPLETE_PAGE_SIZE = 5;
var currentSelected = -1;

Session.set('synced', false);
Session.set('repeat', false);

if(typeof QueryString.listkey !== "undefined"){
  Session.set('listkey', QueryString.listkey)
}
if(typeof QueryString.playchannel !== "undefined"){
  Session.set('playchannel', QueryString.playchannel);
  
  PlayChannels.find({_id:Session.get('playchannel')}).observe({
    added: function (item) {
      console.log(item);
      Session.set('listkey', item.playlist);
      setCurrent('set',Session.get('current'));
      Session.set('owner', item.user);
    } 
  });  
}else{
  checkListKey();
}

loginAsAnonym();


var player;
var current = 0;
var old_current = -1;
var weight = 1000;  
var tag = document.createElement('script');
var login_interval;
var logout_interval;
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function login(type){
  Meteor.logout(function(){
    login_interval = Meteor.setInterval(waitForLogin, 500);
    if(type==='facebook'){
      Meteor.loginWithFacebook(); 
    }else if(type==='google'){
      Meteor.loginWithGoogle();
    }
  });
};
Meteor.call('getUserServiceId', function(error, result){
  if(typeof(error) ==='undefined') Session.set('fulluser',result);
});
/*TIMER WAITING FOR SERVICE LOGIN*/
function waitForLogin(){
  if(Meteor.user() && typeof(Meteor.user().anonym)==='undefined'){
    Meteor.clearInterval(login_interval);
  }
};
/*TIMER WAITING FOR SERVICE LOGOUT*/
function waitForLogout(){
  if(!Meteor.user()){
    Meteor.clearInterval(logout_interval);
    Meteor.flush();
    Session.set('listkey', undefined);
    Session.set('playchannel', undefined);
    loginAsAnonym();
  }  
};
function logout(){
  Meteor.logout();
  logout_interval = Meteor.setInterval(waitForLogout, 500);
};
function loginAsAnonym(){
  if(!Meteor.user()){
    var username = 'anonym'+Meteor.uuid();
    var password = Meteor.uuid()
    Meteor.createUser({username:username, password:password}, {anonym:true}, function(r){
      Meteor.loginWithPassword(username, password);
      checkListKey();
    });
  }  
};
function checkListKey(force_create){
  if(Meteor.user() && !Session.get('listkey') || Meteor.user() && force_create){
    name = 'Untitled-list';
    var saved = (force_create)? true : false;
    var list =  PlayLists.insert({name:name, user:Meteor.user()._id, timestamp:timestamp(),saved:saved, blocked:false});
    Session.set('listkey',list);
    checkPlayChannel();
  }
};
function checkPlayChannel(){
  if(Meteor.user() && Session.get('listkey') && !Session.get('playchannel')){
    pchannel =  PlayChannels.insert({playlist:Session.get('listkey'), user:Meteor.user()._id, current:Session.get('current'), timestamp:timestamp()});
    Session.set('playchannel',pchannel);
    Session.set('owner', Meteor.user()._id);
  }
}
function onYouTubeIframeAPIReady() {
  cursor = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}});
  if(cursor.count()){
    playSong(cursor.fetch()[0].name);    
  }
}
function playSong(vid){
    if(!player){
      player = new YT.Player('player-div', {
        height: '300',
        width: '100%',
        videoId: vid,
        playerVars: { 'autoplay': 0, 'wmode': 'opaque' }, 
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }else{
      player.loadVideoById(vid);
      player.playVideo();
    }
}
function onPlayerReady(event) {
  player.playVideo();
}
function onPlayerStateChange(event) {
  if(event.data==YT.PlayerState.ENDED){
    nextSong();  
  }
}
function stopVideo() {
  player.stopVideo();
}  
function nextSong(){
  setCurrent('modify',1);
  c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[Session.get('current')];
  if(c)
    playSong(c.name);
  else {
    if(Session.get('repeat')){
      setCurrent('set',0);
      c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[Session.get('current')];
      playSong(c.name);
    }
  }
}
function setCurrent(m,i){
  old_current = current;
  if(m=='modify'){
    Session.set('current', Session.get('current') + i);
  }else if(m=='set'){
    Session.set('current', i);
  } 
  if(Session.get('playchannel') ){
    PlayChannels.update({_id:Session.get('playchannel')}, { $set: { current : Session.get('current') }} );    
  }
}
Template.currentvideo.currentVideo = function(){
  if(PlayChannels.findOne(Session.get('playchannel'))){
    var currentPlayChannel = PlayChannels.findOne(Session.get('playchannel'))
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[currentPlayChannel.current];
    return c;
  }
  return false;
};
Template.currentvideo.on_current_video_ready = function(){
  if(Session.get('synced')){
    Meteor.flush();
    Meteor.defer(function(){
      if(PlayChannels.findOne(Session.get('playchannel'))){
        var currentPlayChannel = PlayChannels.findOne(Session.get('playchannel'))
        var c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[currentPlayChannel.current];
        if(c) playSong(c.name);
      }
      return false;    
    });
  }
};
Template.shares.playlist_url = function(){
  return window.location.protocol+'//'+window.location.host+"/?listkey="+Session.get('listkey');
}
Template.shares.playchannel_url = function(){
  if(typeof Session.get('playchannel')==="undefined")
    return false;
  else
    return window.location.protocol+'//'+window.location.host+"/?playchannel="+Session.get('playchannel');
};
Template.shares.on_playchannel_ready = function(){  
  if(typeof(FB)!=='undefined'){
    Meteor.flush();
    Meteor.defer(function(){
      //FB.XFBML.parse();    
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
  }
};
Template.playlists.mylists = function(){
  return PlayLists.find({user:Meteor.user()._id, saved:true})
};
Template.playlist.is_current = function(){
  if(Session.equals('listkey', this._id)){
    return 'current-list';
  }
  return '';
};
Template.playlists.events = {
  'click span':function(e){
    Session.set("playchannel",undefined);
    Session.set("listkey",this._id);
    Meteor.flush();
    var pl = PlayLists.findOne({_id:this._id});
    $('.reseteable').button('toggle');
  },
  'click .create':function(){
    Meteor.flush();
    checkListKey(true);
    Meteor.defer(function(){
      $('#save-control').show();
      $('#listname').select();         
    }); 
  },
  'click .update':function(e){
    $('#save-control').show();
    $('#listname').select();
  },
  'click .savelist':function(){
    $('#save-control').hide();
    var l = (Session.get('edited')) ? Session.get('edited') : Session.get('listkey');
    PlayLists.update({_id:l}, { $set:{name:$('#listname').val(), saved:true} });
    Session.set('edited', null);
  },
  'keydown #save-control input':function(e){
    if(e.which===13){
      $('#save-control').hide();      
      var l = (Session.get('edited')) ? Session.get('edited') : Session.get('listkey');
      PlayLists.update({_id:l}, { $set:{name:$('#listname').val(), saved:true} });
      Session.set('edited', null);
    }
  },
  'click .edit':function(e){
    $('#save-control').show();
    $('#listname').val(this.name);
    $('#listname').select();
    Session.set('edited', this._id);
  },
  'click .delete': function () {
    Session.set('listkey', undefined);
    PlayLists.remove(this._id);
    checkListKey();
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
    if(jQuery.inArray(e.keyCode, CONTROL_KEYCODES)!=-1){
      autocompleter = $('#autocompleter li');
      old = currentSelected;
      
      if(currentSelected==autocompleter.length-1 && e.keyCode == 40){
        currentSelected = 0;
      }else if(!currentSelected && e.keyCode == 38){
        currentSelected = autocompleter.length-1;
      }else{
        if(e.keyCode == 40)
          currentSelected++;
        else if(e.keyCode ==38)
          currentSelected--;
      }
      if(old!=-1) $('#autocompleter li').eq(old).removeClass('selected')
      $('#autocompleter li').eq(currentSelected).addClass('selected')
    }
    if(e.keyCode==ENTER){
      if(currentSelected==autocompleter.length-1){
        autocomple_offset +=AUTOCOMPLETE_PAGE_SIZE;
        search(document.getElementById('nextsong').value, AUTOCOMPLETE_PAGE_SIZE);        
        currentSelected=-1;
      }    
      if(currentSelected!==-1) addSong($('#autocompleter li').eq(currentSelected));
    }
    if(e.keyCode==ESC){
      currentSelected = -1;
      autocomple_offset = 1;
      $("#autocompleter").hide();    
    }
  }  
};
Template.musiclist.songs = function () {
  if(typeof Session.get('playchannel')=== "undefined"){
    checkPlayChannel();
    return Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}});
  }else{
    var cur = PlayChannels.findOne({_id:Session.get('playchannel')});
    if(cur){
      var elements = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch();
      return elements.slice(cur.current+1, elements.length);
    }
  }
  return false;
};
Template.musiclist.events = {
  'click .vote': function () {
    var vote = Songs.find({_id:this._id, voters:{$in:[Meteor.user()._id]}}).count();
    if(!vote)
      Songs.update({_id: this._id},{$inc:{score:1}, $push:{voters:Meteor.user()._id}});
  },
  'click .delete': function () { 
    Songs.remove(this._id);
  },
  'click span.title': function () {
    checkPlayChannel();
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch(); 
    for(k=0,l=c.length;k<l;k++){
      if(c[k]._id == this._id){
        setCurrent('set',k);
        playSong(c[k].name);
      }
    }
   }  
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
  var blocked = (typeof(plo.blocked)==='undefined')? false:(!plo.blocked)? false : true;  
  return (plo.blocked)? 'active' : '';
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
      checkPlayChannel();
      setCurrent('set',0);
      playSong(c.name);
    }
  },
  'click .clearlist': function () {         
    Songs.remove({listkey:Session.get('listkey')});
  },      
  'click .skip': function () {
     nextSong();
  },
  'click .share':function(e){
    Meteor.flush();
    $('#shares').toggle();
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
  'click .addlist':function(e){
    var plo = PlayLists.findOne({_id:Session.get('listkey')});

    delete plo._id;
    plo.user = Meteor.user()._id;
    plo.saved = true;
    
    var new_id = PlayLists.insert(plo);
    Songs.find({listkey:Session.get('listkey')}).forEach(function(item){      
      delete item._id;
      item.user = Meteor.user()._id;
      item.listkey = new_id; 
    });
  },  
  'click .sync': function (e) {
    Session.set('synced', !Session.get('synced'));
  },
  'click .repeat': function (e) {
    Session.set('repeat', !Session.get('repeat'));
  }    
};

function addSong(jselector){
  Meteor.flush();
  var vid = get_youtube_id(jselector.children('a').attr("href"));
  var title = jselector.children('a').attr("title");
  var user_logged = Session.get('fulluser');
  var fbid = (user_logged.services.facebook) ? user_logged.services.facebook.id : false;
  var goid = (user_logged.services.google) ? user_logged.services.google.id : false;
  var so = Songs.findOne({listkey:Session.get('listkey')});
  
  if(typeof(so)!=='undefined'){
    var last_weight = (!so.weight || typeof(so.weight) ==='undefined')? 0:so.weight+1;
  }
  Songs.insert({
    name: vid,
    fbid:fbid,
    goid:goid,
    score: 0,
    title:title,
    listkey:Session.get('listkey'),
    added_by:Meteor.user()._id,
    weight:last_weight,
    timestamp:timestamp()
  });
  
  $("#autocompleter").hide();
  currentSelected = -1;
  $('.nextsong').val('');  
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
  Handlebars.registerHelper('salvable', function(){
    if(Meteor.user()){
      var plo = PlayLists.findOne({_id:Session.get('listkey')});
      if(typeof(plo) !== 'undefined')
        return Session.get('owner') === Meteor.user()._id && !plo.saved;
    }
    return false;
  });  
  Handlebars.registerHelper('profile_image_url', function(){
    var f = Session.get('fulluser')
    if(f){
      var s = f.services;
      var service_id = (s.facebook) ? "http://graph.facebook.com/"+s.facebook.id+"/picture" : (s.google) ? "https://plus.google.com/s2/photos/profile/"+s.google.id+"?sz=30" : false;
      return service_id;
    }else{
      return '';
    }
  });  
}
/*END HANDLEBARS HELPER*/