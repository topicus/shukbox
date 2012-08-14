Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');
Requests = new Meteor.Collection('requests');

Meteor.publish('songs', function (listkey) {
  return Songs.find({listkey:listkey});
});
Meteor.publish('playlists', function (playlist) {
  return PlayLists.find({$or:[{_id:playlist}, {user:this.userId()}]});
});
Meteor.publish('playchannels', function (playchannel) {
  return PlayChannels.find({_id:playchannel});
});
Meteor.methods({
  getUserServiceId: function () {
    return Meteor.users.find({_id:this.userId()}).fetch()[0];
  }
});
Meteor.startup(function () {
  Songs.allow({
    insert: function (uid, doc) {
      var plo = PlayLists.findOne({_id:doc.listkey});
      var blocked = (typeof(plo.blocked)==='undefined')? false:(!plo.blocked)? false : true;
      if(!blocked || plo.user===uid)
        return true;
      else
        return false;
    },
    update: function (uid, doc) {
      return true;
    },
    remove: function (uid, doc) {
      s = Songs.findOne({_id:doc[0]._id});
      p = PlayLists.findOne({_id:s.listkey});
      if(p && p.user===uid)
        return true;
      else
        return false;
    },
    fetch: function (uid, doc) {      
      return true;
    }
  });
  PlayChannels.allow({
    insert: function (uid, doc) {
      return true;
    },
    update: function (uid, doc) {
      return true;
    },
    remove: function (uid, doc) {
      return true;
    },
    fetch: function (uid, doc) {
      return true;
    }
  });
  PlayLists.allow({
    insert: function (uid, doc) {
      return true;
    },
    update: function (uid, doc) {
      var pl = PlayLists.findOne({_id:doc[0]._id});
      if(uid === pl.user)
        return true;
      else
        return false;
    },
    remove: function (uid, doc) {
      var pl = PlayLists.findOne({_id:doc[0]._id});
      if(uid === pl.user){
        Songs.remove({listkey:doc[0]._id});
        return true;
      }else
        return false;
    },
    fetch: function (uid, doc) {
      return true;
    }
  });  
});
