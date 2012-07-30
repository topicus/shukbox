Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');

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

var CONTROL_KEYCODES = new Array(40,38,37,39)
var ENTER = 13;
var currentSelected = -1;
var HAS_INPUT_EVENT = 0;
  
if(QueryString.listkey != undefined){
  Session.set('listkey', QueryString.listkey)
}
if(QueryString.playchannel!=undefined){
  Session.set('playchannel', QueryString.playchannel);
}
Session.set('current', 0);

PlayChannels.find({_id:Session.get('playchannel')}).observe({
  added: function (item) {
    Session.set('listkey', item.playlist);
    setCurrent('set',Session.get('current'));
  } 
});  
checkListKey();
if(!Meteor.user()){
  var username = 'anonym'+Meteor.uuid();
  var password = Meteor.uuid()
  Meteor.createUser({username:username, password:password}, null, function(r){
    Meteor.loginWithPassword(username, password);
  });
}



var player;
var current = 0;
var old_current = -1;
var weight = 1000;  
var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


function checkListKey(name){
  if(Meteor.user() && !Session.get('listkey')){
    name = (name)? name : Meteor.uuid();
    Session.set('listkey', PlayLists.insert({name:name, user:Meteor.user()._id}));
  }
}
function checkPlayChannel(){
  if(Meteor.user() && Session.get('listkey') && !Session.get('playchannel')){
    pchannel =  PlayChannels.insert({playlist:Session.get('listkey'), user:Meteor.user()._id, current:Session.get('current')});
    Session.set('playchannel',pchannel);
  }
}
function onYouTubeIframeAPIReady() {
  cursor = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
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
  c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];
  if(c)
    playSong(c.name);
  else {
    setCurrent('set',0);
    c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];
    playSong(c.name);
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
    PlayChannels.update({_id:Session.get('playchannel')}, { $set: { current : Session.get('current') }} )    
  }
}
Template.musiclist.invokeAfterLoad = function () {
  Meteor.defer(function () {     
    $('input.nextsong').bind('input', function() {
      HAS_INPUT_EVENT = 1;
      search($('#nextsong').val());
    });
    $('.tip').tooltip({animation:true,placement:'bottom'});
  });
  return "";
};
Template.currentvideo.currentVideo = function(){
  if(PlayChannels.findOne(Session.get('playchannel'))){
    var currentPlayChannel = PlayChannels.findOne(Session.get('playchannel'))
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[currentPlayChannel.current];
    return c;
  }
  return false;
}
Template.shares.playlist_url = function(){
  return window.location.protocol+'//'+window.location.host+"/?listkey="+Session.get('listkey');
}
Template.shares.playchannel_url = function(){
  if(Session.get('playchannel')==undefined)
    return false;
  else
    return window.location.protocol+'//'+window.location.host+"/?playchannel="+Session.get('playchannel');
}
var current = Session.get('current');
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
  if(Session.get('playchannel')==undefined){
    return Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
  }else{
    var cur = PlayChannels.findOne({_id:Session.get('playchannel')});
    if(cur){
      var elements = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch();
      console.log(elements.slice(cur.current+1, elements.length -1));
      return elements.slice(cur.current+1, elements.length -1);
    }
  }
  return false;
};
Template.musiclist.events = {
  'click .vote': function () {
    Songs.update({_id: this._id},{$inc:{score:1}});
  }, 
  'click .delete': function () { 
    Songs.remove(this._id);
  },
  'click .share':function(){
    $('#shares').show();
  },
  'click .playsong': function () {
    checkPlayChannel();
    c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];          
    setCurrent('set',0);
    if(c) playSong(c.name);        
   },
  'click span.title': function () {
    checkPlayChannel();
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch(); 
    for(k=0,l=c.length;k<l;k++){
      if(c[k]._id == this._id){
        setCurrent('set',k);
        playSong(c[k].name);
      }
    }
   },
  'click .clearlist': function () {         
      Songs.remove({listkey:Session.get('listkey')});
   },      
  'click .skip': function () {
      nextSong();
   },
  'keyup input.nextsong':function(e){
    if(!HAS_INPUT_EVENT && jQuery.inArray(e.keyCode, CONTROL_KEYCODES)==-1 && e.keyCode!=ENTER){
      search($('#nextsong').val());
    }
   },
  'keydown input.nextsong':function(e){

   }     
};
function addSong(jselector){
  Meteor.flush();
  vid = get_youtube_id(jselector.children('a').attr("href"));
  title = jselector.children('a').attr("title");
  item_min_score = Songs.findOne({listkey:Session.get('listkey')},{sort: {score: 1}, limit:1});
  if(item_min_score) weight = item_min_score.score - 1;
  Songs.insert({name: vid, score: weight, title:title, listkey:Session.get('listkey')});
  $("#autocompleter").hide();
  currentSelected = -1;
  $('.nextsong').val('');  
  c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
  if(c.count()) $('ul.playlist').css("border", '1px solid #CCC');
}
