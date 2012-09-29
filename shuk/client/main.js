include_facebook();
Videos = new Meteor.Collection("videos");
PlayLists = new Meteor.Collection('playlists');
Requests = new Meteor.Collection('requests');
Activities = new Meteor.Collection("activities");
TopTenLists = new Meteor.Collection("toptenlists");

Session.set('page', null);


Meteor.startup(function(){
  userManager = new UserManager();
  playManager = new PlaylistManager();
  controls = new Controls();
  activity = new ActivityManager();
  videos = new VideoManager(); 
  init();
});
Meteor.autosubscribe(function () {
  Meteor.subscribe('videos',Session.get('listkey'));
  Meteor.subscribe('playlists', Session.get('listkey'));
  Meteor.subscribe('activities', Session.get('listkey'));
  Meteor.subscribe('toptenlists');
});

var CONTROL_KEYCODES = new Array(40,38,37,39)
var ENTER = 13;
var ESC = 27;
var AUTOCOMPLETE_PAGE_SIZE = 5;
var currentSelected = -1;


var player;
var current = 0;
var old_current = -1;
var tag = document.createElement('script');
var login_interval;
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function init(){
  Backbone.history.start({pushState: true});
  if(Meteor.user() === null) 
    userManager.loginAsAnonym();
}


