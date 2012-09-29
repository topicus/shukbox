Videos = new Meteor.Collection("videos");
PlayLists = new Meteor.Collection('playlists');
Requests = new Meteor.Collection('requests');
Activities = new Meteor.Collection("activities");
TopTenLists = new Meteor.Collection("toptenlists");

Meteor.publish('videos', function (listkey) {
  return Videos.find({listkey:listkey});
});
Meteor.publish(null, function(){
  return Meteor.users.find(this.userId(),{fields: {profile: 1, username: 1, emails: 1, anonym:1, services:1}});
});
Meteor.publish('playlists', function (playlist) {
  return PlayLists.find({$or:[{_id:playlist}, {user:this.userId(), saved:true}]}); 
});
Meteor.publish('activities', function(){
  return Activities.find({}, {sort:{when:-1},limit:6});
});
Meteor.publish('toptenlists', function(){
  console.log("PUBLICANDO TOPTEN");
  var cursor = PlayLists.find({saved:true}, {sort:{score:-1}, limit:10});
  var self = this;
  var collection = 'toptenlists';
  var observe_handle = cursor.observe({
    added: function (obj) {  
      obj.user_obj = getFilteredUser(obj.user, self);
      self.set(collection, obj._id, obj);
      self.flush();
    },
    changed: function (obj, old_idx, old_obj) {
      var set = {};
      _.each(obj, function (v, k) {
        if (!_.isEqual(v, old_obj[k]))
          set[k] = v;
      });
      self.set(collection, obj._id, set);
      var dead_keys = _.difference(_.keys(old_obj), _.keys(obj));
      self.unset(collection, obj._id, dead_keys);
      self.flush();
    },
    removed: function (old_obj, old_idx) {
      self.unset(collection, old_obj._id, _.keys(old_obj));
      self.flush();
    }
  });  
  self.complete();
  self.flush();

});
Meteor.publish('profiles', function(profile){
  var cursor = Meteor.users.find(profile);
  this._publishCursor(cursor, 'profiles');
  return ; 
});