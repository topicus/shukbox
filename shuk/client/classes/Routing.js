var ShukboxRouter = Backbone.Router.extend({
  routes: {
    ":playlist": "main",
    "":"init",
    "profile/:userid": "profile"
  },
  init:function(){
    Session.set('page', 'home');
    playManager.create();
  },
  main: function (playlist) {
    Session.set('page', 'home');
    Session.set('listkey', playlist);
    if(Meteor.user()){
        var plo = PlayLists.findOne({_id:Session.get('listkey'), saved:true});
        if(!undef(plo)){
          var name = (plo.name)? plo.name : "Anonym";
          //activity.add("listened to", plo);          
        }
    }
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