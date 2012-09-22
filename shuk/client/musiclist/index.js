Template.musiclist.rendered = function(){
  $('.dropdown-toggle').dropdown();
};
Template.musiclist.songs = function () {
  if(typeof(Session.get('listkey'))=== "undefined"){
    return Songs.find({listkey:Session.get('listkey')},{sort: {when: 1}});
  }else{
    return Songs.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch();
  }
  return false;
};
Template.musiclist.events({
  'click .vote': function (e) {
    console.log("click on vote");
    var vote = Songs.find({_id:this._id, voters:{$in:[Meteor.user()._id]}}).count();
    if(!vote)
      Songs.update({_id: this._id},{$inc:{score:1}, $push:{voters:Meteor.user()._id}});
    return false;
  },
  'click .copyto': function (e) {
    console.log(this._id);
    playManager.setSongToCopy(this._id);
  },
  'click .delete': function (e) { 
    console.log("click on delete");
    var pco = PlayLists.findOne({_id:Session.get('listkey')});
    var so = Songs.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch()[pco.current];
    if(so._id === this._id){
      Songs.remove(this._id);
      controls.stopVideo();      
      controls.setCurrent('set', -1);
    }else{
      Songs.remove(this._id);
    }
    return false;
  },
  'click li .song': function (e) {
    var s = Songs.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch(); 
    for(k=0,l=s.length;k<l;k++){
      if(s[k]._id == this._id){
        controls.setCurrent('set',k);
        controls.playSong(s[k].name);
      }
    }
  },
  'click .actions':function(e){
    return false;
  }  
});
Template.song.is_current = function(){
    var plo = PlayLists.findOne({_id:Session.get('listkey')});
    if(plo){
      var so = Songs.find({listkey:Session.get('listkey')},{sort: {when: 1}}).fetch()[plo.current];
      if(typeof(so) !== 'undefined' && so._id===this._id){
        if(Session.get('synced')){
          Meteor.flush();
          Meteor.defer(function(){
            controls.playSong(so.name);
          });
        }
        return ' current'; 
      }
    }

    return '';
};
Template.dropdown_playlist.playlist = function(){
  return PlayLists.find({user:Meteor.user()._id, saved:true},{sort: {when: -1}})
};
Template.dropdown_playlist.events({
  'click .dropdown-menu li':function(e){
    playManager.copySongToList(this._id);
    $('.dropdown').removeClass('open');
    Alerts.show('Video has been saved.');
    return false;
  }
});