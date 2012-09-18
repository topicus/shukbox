var ShukboxRouter = Backbone.Router.extend({
  routes: {
    ":playlist": "main",
    "":"init",
    "profile/:userid": "profile"
  },
  init:function(){
    console.log("init");
    playManager.newList();
  },
  main: function (playlist) {
    console.log("main");
    Session.set('page', 'home');
    Session.set('listkey', playlist);
    this.navigate(playlist, true);
    

    PlayLists.find({_id:playlist}).observe({
      added: function (item) {        
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
  setList: function (playlist) {
    this.navigate(playlist, true);
  }
});
Router = new ShukboxRouter;