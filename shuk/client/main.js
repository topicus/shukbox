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
  searchWidget = new SearchWidget(); 
  searchWidget.testSearch("red");
  init();
});
Meteor.autosubscribe(function () {
  Meteor.subscribe('videos',Session.get('listkey'));
  Meteor.subscribe('playlists', Session.get('listkey'));
  Meteor.subscribe('activities', Session.get('listkey'));
  Meteor.subscribe('toptenlists');
});


function init(){
  Backbone.history.start({pushState: true});
  if(Meteor.user() === null) 
    userManager.loginAsAnonym();
}
var tag = document.createElement('script');
    tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;
