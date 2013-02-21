Meteor.startup(function(){
  Template.musiclist.rendered = function(){
    $('.dropdown-toggle').dropdown();
    $(".scrollwrap").mCustomScrollbar({
      horizontalScroll:true
    });
  };
  Template.musiclist.videos = function () {
    if(typeof(Session.get('listkey'))=== "undefined"){
      return Videos.find({listkey:Session.get('listkey')},{sort: {when: 1}});
    }else{
      return Videos.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch();
    }
    return false;
  };
  Template.musiclist.events({
    'click .vote': function (e) {
      var vote = Videos.find({_id:this._id, voters:{$in:[Meteor.user()._id]}}).count();
      if(!vote)
        Videos.update({_id: this._id},{$inc:{score:1}, $push:{voters:Meteor.user()._id}});
      return false;
    },
    'click .copyto': function (e) {
      playManager.setVideoToCopy(this._id);
    },
    'click .delete': function (e) { 
      videos.remove(this._id);
      return false;
    },
    'click li .video_item': function (e) {
      var s = Videos.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch(); 
      for(k=0,l=s.length;k<l;k++){
        if(s[k]._id == this._id){
          controls.setCurrent('set',k);
          controls.play(s[k].vid);
        }
      }
    },
    'click .actions':function(e){
      return false;
    }  
  });
  Template.video_item.is_current = function(){
      var plo = PlayLists.findOne({_id:Session.get('listkey')});
      if(plo){
        var so = Videos.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch()[plo.current];
        if(typeof(so) !== 'undefined' && so._id===this._id){
          if(Session.get('synced')){
            Meteor.flush();
            Meteor.defer(function(){
              controls.play(so.name);
            });
          }
          return ' current'; 
        }
      }

      return '';
  };
  Template.dropdown_playlist.playlist = function(){
    if (Meteor.user())
      return PlayLists.find({user:Meteor.user()._id, saved:true},{sort: {when: -1}})
    else
      return false;
  };
  Template.dropdown_playlist.events({
    'click .dropdown-item-playlist':function(e){
      playManager.copyVideoToList(this._id);
      $('.dropdown').removeClass('open');
      Alerts.show('Video has been saved.');
      return false;
    }
  });
});