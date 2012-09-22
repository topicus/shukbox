include_facebook();
Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
Requests = new Meteor.Collection('requests');
Activities = new Meteor.Collection("activities");
TopTenLists = new Meteor.Collection("toptenlists");

Session.set('listkey', null);
Session.set('fulluser', null);
Session.set('owner', null);
Session.set('edited', null);
Session.set('synced', null);
Session.set('repeat', true);
Session.set('current', null);
Session.set('page', null);
Session.set('profile', null);

Meteor.startup(function(){
 
});
Meteor.autosubscribe(function () {
    Meteor.subscribe('songs',Session.get('listkey'));
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
Template.modifiers.events({
  'click .playsong': function () {    
    c = Songs.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch()[0];          
    if(typeof c !== "undefined"){
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
      $('#playlist_url').select();
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
  },   
  'click .vote-button': function(e){
    playManager.votePlaylist(Session.get("listkey"));
  } 
});
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
    return Session.get('page') === page;
  });   
  Handlebars.registerHelper('get_profile_image_url', function(user){
    if(!_.isUndefined(user) && _.has(user.services, 'facebook')){
      return "http://graph.facebook.com/"+user.services.facebook.id+"/picture";
    }else if(!_.isUndefined(user) && _.has(user.services, 'google')){
      return "https://plus.google.com/s2/photos/profile/"+user.services.google.id+"?sz=30";
    }else if(!_.isUndefined(user) && _.has(user.twitter, 'twitter')){
      return user.services.google.id;
    }
    return false;
  });
}
/*END HANDLEBARS HELPER*/


