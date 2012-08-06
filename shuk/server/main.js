Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');

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
    insert: function () { return true; },
    update: function () { return true; },
    remove: function () { return true; },
    fetch: function () { return true; }
  });
  PlayChannels.allow({
    insert: function () { return true; },
    update: function () { return true; },
    remove: function () { return true; },
    fetch: function () { return true; }
  });
  PlayLists.allow({
    insert: function () { return true; },
    update: function () { return true; },
    remove: function () { return true; },
    fetch: function () { return true; }
  });  
});