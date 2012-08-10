Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');
Requests = new Meteor.Collection('requests');

Meteor.publish('songs', function () {
  return Songs.find();
});
Meteor.publish('playlists', function () {
  return PlayLists.find();
});
Meteor.publish('playchannels', function () {
  return PlayChannels.find();
});
Meteor.methods({
  getUserServiceId: function () {
    return Meteor.users.find({_id:this.userId()}).fetch()[0];
  }
});
Meteor.startup(function () {

  Songs.allow({
    insert: function (uid, doc) {
      /*
      if(PlayLists.findOne({_id:doc.listkey}).user===uid)
        return true;
      else
        return false;
      */
      return true;
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
      return true;
    },
    remove: function (uid, doc) {
      return true;
    },
    fetch: function (uid, doc) {
      return true;
    }
  });  
});