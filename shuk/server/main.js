Videos = new Meteor.Collection("videos");
PlayLists = new Meteor.Collection('playlists');
Requests = new Meteor.Collection('requests');

Meteor.publish('videos', function (listkey) {
  return Videos.find({listkey:listkey});
});
Meteor.publish(null, function(){
  return Meteor.users.find(this.userId,{fields: {profile: 1, username: 1, emails: 1, anonym:1, services:1}});
});
Meteor.publish('playlists', function (playlist) {
  return PlayLists.find({$or:[{_id:playlist}, {user:this.userId, saved:true}]}); 
});