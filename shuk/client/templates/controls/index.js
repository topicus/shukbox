Meteor.startup(function(){
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
      Meteor.flush();  
      c = Videos.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch()[0];          
      if(typeof c !== "undefined"){
        controls.setCurrent('set',0);
        controls.play(c.vid);
      }
    },
    'click .clearlist': function () {         
      Videos.remove({listkey:Session.get('listkey')});
    },      
    'click .skip': function () {
      controls.next();
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

});
