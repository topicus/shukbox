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
Session.set('synced', null);
Session.set('repeat', true);
Session.set('current', null);

Meteor.autosubscribe(function () {
    Meteor.subscribe('songs',Session.get('listkey'));
    Meteor.subscribe('playchannels', Session.get('playchannel'));
    Meteor.subscribe('playlists', Session.get('listkey'));
  
});

//////////////// ROUTER | TRACKING PLAYCHANNEL IN THE URL /////////////////
var ShukboxRouter = Backbone.Router.extend({
  routes: {
    ":playchannel": "main"
  },
  main: function (playchannel) {
    Session.set('playchannel', playchannel);
    PlayChannels.find({_id:Session.get('playchannel')}).observe({
      added: function (item) {        
        Session.set('listkey', item.playlist);
        setCurrent('set',item.current);
        Session.set('owner', item.user);
      } 
    });  
  },
  setList: function (playchannel) {
    this.navigate(playchannel, true);
  }
});
Router = new ShukboxRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
  Router.setList(Session.get('playchannel'));
});
//////////////// END ROUTER /////////////////

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


var player;
var current = 0;
var old_current = -1;
var weight = 1000;  
var tag = document.createElement('script');
var login_interval;
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//INIT ALL
init();

function init(){
  //INIT PROCCESS
  checkListKey();
  if(Meteor.user() === null) loginAsAnonym();
  getFullUser();
}
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
/*TIMER WAITING FOR SERVICE LOGIN*/
function waitForLogin(){
  if(Meteor.user() && typeof(Meteor.user().anonym)==='undefined'){
    Meteor.clearInterval(login_interval);
    getFullUser();
  }
};
function logout(){
  Meteor.logout(function(){
    Session.get('fulluser', null)    
  });
};
function getFullUser(){
    Meteor.call('getUserServiceId', function(error, result){
      if(typeof(error) ==='undefined') Session.set('fulluser',result);
    });
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
    Router.setList(pchannel);
  }
};
function onYouTubeIframeAPIReady() {
  cursor = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}});
  if(cursor.count()){
    playSong(cursor.fetch()[0].name);    
  }
};
function playSong(vid){
    if(typeof(player)==='undefined' || !player){
      player = new YT.Player('player-div', {
        height: '300',
        width: '100%',
        videoId: vid,
        playerVars: { 'autoplay': 0, 'wmode': 'opaque' }, 
        events: {
          'onReady': function(event){
            player.playVideo();
          },
          'onStateChange': onPlayerStateChange
        }
      });
    }else if(player){
      player.loadVideoById(vid);
      player.playVideo();      
    }
};
function onPlayerStateChange(event) {
  if(event.data==YT.PlayerState.ENDED){
    nextSong();  
  }
};
function stopVideo() {
  if(player){
    player.stopVideo();
    player.destroy();    
  }
  player = null;
};  
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
};
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
};
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
  }
};
Template.playlists.mylists = function(){
  return PlayLists.find({user:Meteor.user()._id, saved:true})
};
Template.playlist.is_current = function(){
  if(Session.equals('listkey', this._id)){
    return 'active';
  }
  return '';
};
Template.playlists.events = {
  'click li':function(e){
    stopVideo();
    Session.set("playchannel",undefined);
    Session.set("listkey",this._id);
    Meteor.flush();
    var pl = PlayLists.findOne({_id:this._id});
    $('.reseteable').button('toggle');
  },
  'click .create':function(){
    Meteor.flush();
    Session.set('playchannel', null);
    checkListKey(true);
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
  'click .edit':function(e){
    $('#save-control').show();
    $('#listname').val(this.name);
    $('#listname').select();
    $('.savelist').html('Edit');
    Session.set('edited', this._id);
    return false;
  },
  'click .delete': function () {
    Session.set('listkey', undefined);
    PlayLists.remove(this._id);
    checkListKey();
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
  if(typeof Session.get('playchannel')=== "undefined"){
    checkPlayChannel();
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
      stopVideo();
    }
    Songs.remove(this._id);
    setCurrent('modify', -1);
    nextSong();
    return false;
  },
  'click li': function (e) {
    checkPlayChannel();
    var s = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch(); 
    for(k=0,l=s.length;k<l;k++){
      if(s[k]._id == this._id){
        setCurrent('set',k);
        playSong(s[k].name);
      }
    }
  }  
};
Template.song.is_current = function(){
    var pco = PlayChannels.findOne({_id:Session.get('playchannel')});
    var so = Songs.find({listkey:Session.get('listkey')},{sort: {weight: 1}}).fetch()[pco.current];
    if(typeof(so) !== 'undefined' && so._id===this._id){
      if(Session.get('synced')){
        Meteor.flush();
        Meteor.defer(function(){
          playSong(so.name);
        });
      }
      return ' current'; 
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
  'click .sync': function (e) {
    Session.set('synced', !Session.get('synced'));
  },
  'click .repeat': function (e) {
    Session.set('repeat', !Session.get('repeat'));
  }    
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
    
    var new_id = PlayLists.insert(plo);
    Songs.find({listkey:Session.get('listkey')}).forEach(function(item){      
      delete item._id;
      item.listkey = new_id;
      Songs.insert(item);
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
}
/*END HANDLEBARS HELPER*/


