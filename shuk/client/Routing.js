var ShukboxRouter = Backbone.Router.extend({
  routes: {
    ":playchannel": "main",
    "":"init",
    "profile/:userid": "profile"
  },
  init:function(){
    playManager.newList();
  },
  main: function (playchannel) {
    Session.set('page', 'home');
    Session.set('playchannel', playchannel);
    this.navigate(playchannel, true);
    PlayChannels.find({_id:playchannel}).observe({
      added: function (item) {        
        Session.set('listkey', item.playlist);
        controls.setCurrent('set',item.current);
        Session.set('owner', item.user);
      } 
    });  
  },
  profile: function(userid){
    Session.set('page', 'profile');
    if(typeof userid === 'undefined'){
      //TODO
    }
  },
  setList: function (playchannel) {
    this.navigate(playchannel, true);
  }
});
Router = new ShukboxRouter;