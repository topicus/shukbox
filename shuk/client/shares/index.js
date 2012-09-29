Meteor.startup(function(){
  Template.shares.playlist_url = function(){
    if(typeof Session.get('listkey')==="undefined")
      return false;
    else
      return window.location.protocol+'//'+window.location.host+"/"+Session.get('listkey');
  }
  Template.shares.on_playlist_ready = function(){  
    if(typeof(FB)!=='undefined'){
      Meteor.flush();
      Meteor.defer(function(){
        FB.XFBML.parse();    
      });
    }
  };
  Template.shares.events({
    'click #playlist_url': function(e){
      Meteor.flush();
      $(e.target).select();  
    },
    'click .qrcode':function(e){
      Meteor.flush();
      $('.qr-wrap').slideToggle('medium'); 
    }
  });
});