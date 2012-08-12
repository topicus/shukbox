include_facebook();
Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');
Requests = new Meteor.Collection('requests');

Meteor.autosubscribe(function () {
  Meteor.subscribe('songs');
  Meteor.subscribe('playlists');
  Meteor.subscribe('playchannels');
});
/*
var insertedNodes = [];
document.addEventListener("DOMNodeInserted", function(e) {
 console.log(e.target);
}, false);
*/
var SYNC = false;
var REPEAT = false;
var CONTROL_KEYCODES = new Array(40,38,37,39)
var ENTER = 13;
var currentSelected = -1;
var HAS_INPUT_EVENT = 0;
var YT_API_READY = 0;
if(typeof QueryString.listkey !== "undefined"){
  Session.set('listkey', QueryString.listkey)
}
if(typeof QueryString.playchannel !== "undefined"){
  Session.set('playchannel', QueryString.playchannel);
  PlayChannels.find({_id:Session.get('playchannel')}).observe({
    added: function (item) {
      Session.set('listkey', item.playlist);
      setCurrent('set',Session.get('current'));
      Session.set('owner', item.user);
    } 
  });  
}else{
  checkListKey();
}

loginAsAnonym();


$(document).ready(function(){
    $('input.nextsong').bind('input', function() {
      HAS_INPUT_EVENT = 1;
      search($('#nextsong').val());
    });
});

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
  login_interval = Meteor.setInterval(waitForLogin, 500);
  if(type==='facebook'){
    Meteor.loginWithFacebook(); 
  }else if(type==='google'){
    Meteor.loginWithGoogle();
  }
}
function waitForLogin(){
  if(Meteor.user() && typeof(Meteor.user().anonym)==='undefined'){
    Meteor.clearInterval(login_interval);
  }
};
function waitForLogout(){
  if(!Meteor.user()){
    Meteor.clearInterval(logout_interval);
    Meteor.flush();
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
    var list =  PlayLists.insert({name:name, user:Meteor.user()._id, timestamp:timestamp(),saved:saved});
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
  cursor = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}});
  if(cursor.count()){
    playSong(cursor.fetch()[0].name);    
  }
}
function playSong(vid){
    YT_API_READY = 1;
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
  c = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}}).fetch()[Session.get('current')];
  if(c)
    playSong(c.name);
  else {
    if(REPEAT){
      setCurrent('set',0);
      c = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}}).fetch()[Session.get('current')];
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
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}}).fetch()[currentPlayChannel.current];
    return c;
  }
  return false;
};
Template.currentvideo.on_current_video_ready = function(){
  if(SYNC){
    Meteor.flush();
    Meteor.defer(function(){
      if(PlayChannels.findOne(Session.get('playchannel'))){
        var currentPlayChannel = PlayChannels.findOne(Session.get('playchannel'))
        var c = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}}).fetch()[currentPlayChannel.current];
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
  return PlayLists.find({user:this.userId, saved:true})
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
  },
  'click .create':function(){
    checkListKey(true);
  },
  'click .update':function(){
    $('#save-control').toggle();
    $('#listname').select();
  },
  'click .savelist':function(){
    $('#save-control').toggle();
    PlayLists.update({_id:Session.get('listkey')}, { $set:{name:$('#listname').val(), saved:true} }); 
  }, 
  'click .delete': function () { 
    PlayLists.remove(this._id);
  }
};
Template.search.on_ready_search = function(){
  Meteor.flush();
  Meteor.defer(function(){
    
    $('input.nextsong').bind('input', function() {
      HAS_INPUT_EVENT = 1;
      search($('#nextsong').val());
    });
  });
};
Template.search.events = {
  'keydown input.nextsong':function(e){
    if(jQuery.inArray(e.keyCode, CONTROL_KEYCODES)!=-1){
      autocompleter = $('#autocompleter li');
      old = currentSelected;
      if(currentSelected ==-1){
        currentSelected = 0;
      }else if(currentSelected==autocompleter.length-1 && e.keyCode == 40){
        currentSelected=0;
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
      addSong($('#autocompleter li').eq(currentSelected));
    }
  }  
};
Template.musiclist.songs = function () {
  if(typeof Session.get('playchannel')=== "undefined"){
    checkPlayChannel();
    return Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}});
  }else{
    var cur = PlayChannels.findOne({_id:Session.get('playchannel')});
    if(cur){
      var elements = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}}).fetch();
      return elements.slice(cur.current+1, elements.length);
    }
  }
  return false;
};
Template.controls.events = {   
  'click .playsong': function () {    
    c = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}}).fetch()[0];          
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
   }  
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
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {timestamp: 1}}).fetch(); 
    for(k=0,l=c.length;k<l;k++){
      if(c[k]._id == this._id){
        setCurrent('set',k);
        playSong(c[k].name);
      }
    }
   }  
};
Template.musiclist.invokeAfterLoad = function () {
  Meteor.defer(function () {
    $('.tip').tooltip({animation:true,placement:'bottom'});
  });
  return "";
};
Template.modifiers.events = {
  'click .block': function () {
    if(PlayLists.find({_id:Session.get('listkey')}).count()){
      PlayLists.update({_id:Session.get('listkey')}, {$set:{blocked:true}});
      console.log(PlayLists.findOne({_id:Session.get('listkey')}));
    }
  },
  'click .sync': function () {
     SYNC = !SYNC;
  }  
};
function addSong(jselector){
  Meteor.flush();
  var vid = get_youtube_id(jselector.children('a').attr("href"));
  var title = jselector.children('a').attr("title");

  Meteor.call('getUserServiceId',function(error,result){
    if(typeof(error) === 'undefined'){     
      fbid = (result.services.facebook) ? result.services.facebook.id : false;
      goid = (result.services.google) ? result.services.google.id : false;
      Songs.insert({name: vid, fbid:fbid, goid:goid, score: 0, title:title, listkey:Session.get('listkey'), added_by:Meteor.user()._id,timestamp:timestamp()});
    }
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
    if(Meteor.user()) return Session.get('owner') === Meteor.user()._id;
  });
}
/*END HANDLEBARS HELPER*/