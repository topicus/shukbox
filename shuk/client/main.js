include_facebook();
Videos = new Meteor.Collection("videos");
PlayLists = new Meteor.Collection('playlists');
Requests = new Meteor.Collection('requests');

Session.set('page', null);


Meteor.startup(function(){
  userManager = new UserManager();
  playManager = new PlaylistManager();
  controls = new Controls();
  videos = new VideoManager();
  searchWidget = new SearchWidget(); 
  init();
});
Meteor.autosubscribe(function () {
  Meteor.subscribe('videos',Session.get('listkey'));
  Meteor.subscribe('playlists', Session.get('listkey'));
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
