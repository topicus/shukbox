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
Meteor.methods({
  addPlaylist: function(doc){
    console.log("Main::addPlaylist");
    doc.when = Date.now(); // ms since epoch
    return PlayLists.insert(doc);
  }, 
  addVideo: function(doc){
    console.log(doc);
    console.log("Main::addSong");
    doc.when = Date.now(); // ms since epoch
    return Videos.insert(doc);
  },
  addActivity: function(doc){
    console.log("Main::addActivity");
    doc.when = Date.now();
    return Activities.insert(doc);
  }
});

Meteor.startup(function () {
  Videos.allow({
    insert: function (uid, doc) {
      console.log("INSERT ALLOW");
      var plo = PlayLists.findOne({_id:doc.listkey});
      var blocked = (typeof(plo.blocked)==='undefined')? false:(!plo.blocked)? false : true;
      if(!blocked || plo.user===uid)
        return true;
      else
        return false;
    },
    update: function (uid, doc) {
      console.log("UPDATE ALLOW");
      return true;
    },
    remove: function (uid, doc) {
      console.log("REMOVE ALLOW");
      var so = Videos.findOne({_id:doc[0]._id});
      var plo = PlayLists.findOne({_id:so.listkey});
      if(plo && plo.user===uid)
        return true;
      else
        return false;
    },
    fetch: function (uid, doc) {    
      console.log("FETCH ALLOW");  
      return true;
    }
  });
  PlayLists.allow({
    insert: function (uid, doc) {
      console.log("INSERT ALLOW PLAYLIST");
      return true;
    },
    update: function (uid, doc, fields, modifiers) {
      console.log("UPDATE ALLOW PLAYLIST");
      var plo = PlayLists.findOne({_id:doc[0]._id});
      var perms = ['score', 'voters'];
      if(uid === plo.user || publicFields(perms, fields)){
        return true;
      }else{
        return false; 
      }
    },
    remove: function (uid, doc) {
      var plo = PlayLists.findOne({_id:doc[0]._id});
      if(plo && uid === plo.user){
        Videos.remove({listkey:doc[0]._id});
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

function getFilteredUser(uid, that){
  var service_id;
  var user = Meteor.users.findOne({_id:uid}); 
  if(!_.isUndefined(user) && !_.isUndefined(user.services)){
    _.each(user.services, function(service_obj, service_key){
      delete user.services[service_key]["accessToken"];
    });   
  }
  return user;
}
