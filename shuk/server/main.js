Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
Requests = new Meteor.Collection('requests');
LatestLists = new Meteor.Collection("latestlists");
TopTenLists = new Meteor.Collection("toptenlists");

Meteor.publish('songs', function (listkey) {
  return Songs.find({listkey:listkey});
});
Meteor.publish('playlists', function (playlist) {
  return PlayLists.find({$or:[{_id:playlist}, {user:this.userId(), saved:true}]}); 
});
Meteor.publish('latestlists', function(){
  var cursor = PlayLists.find({saved:true}, {sort:{when:-1}, limit:8})
  var self = this;
  var collection = 'latestlists';
  var observe_handle = cursor.observe({
    added: function (obj) {
      obj.user_obj = getFilteredUser(obj.user);
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

Meteor.publish('toptenlists', function(){
  var cursor = PlayLists.find({saved:true}, {sort:{score:-1}, limit:10});
  var self = this;
  var collection = 'toptenlists';
  var observe_handle = cursor.observe({
    added: function (obj) {
      obj.user_obj = getFilteredUser(obj.user);
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
Meteor.methods({
  getUserServiceId: function () {
    return Meteor.users.find({_id:this.userId()}).fetch()[0];
  },
  getLatestLists: function(){
    return PlayLists.find({saved:true}, {sort:{when:-1}, limit:5}).fetch(); 
  },  
  addPlaylist: function(doc){
    doc.when = Date.now(); // ms since epoch
    return PlayLists.insert(doc);
  }, 
  addSong: function(doc){
    doc.when = Date.now(); // ms since epoch
    return Songs.insert(doc);
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
      var so = Songs.findOne({_id:doc[0]._id});
      var plo = PlayLists.findOne({_id:so.listkey});
      if(plo && plo.user===uid)
        return true;
      else
        return false;
    },
    fetch: function (uid, doc) {      
      return true;
    }
  });
  PlayLists.allow({
    insert: function (uid, doc) {
      return true;
    },
    update: function (uid, doc, fields, modifiers) {
      var plo = PlayLists.findOne({_id:doc[0]._id});
      var perms = ['score', 'voters'];
      if(uid === plo.user || publicFields(perms, fields)){
        return true;
      }else{
        return false; 
      }
    },
    remove: function (uid, doc) {
      console.log(doc);
      var plo = PlayLists.findOne({_id:doc[0]._id});
      if(plo && uid === plo.user){
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

function publicFields(fields, intent){
  for(keyfield in intent){
      var test = fields.indexOf(intent[keyfield]);
      if(test === -1) return false;
  }
  return true;
};
function getFilteredUser(uid){
  var service_id;
  var user = Meteor.users.findOne(uid);  
  _.each(user.services, function(service_obj, service_key){
    delete user.services[service_key]["accessToken"];
  });
  return user;
}
