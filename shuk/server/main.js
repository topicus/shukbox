Songs = new Meteor.Collection("songs");
PlayLists = new Meteor.Collection('playlists');
PlayChannels = new Meteor.Collection('playchannels');
Requests = new Meteor.Collection('requests');
LatestLists = new Meteor.Collection("latestlists");
TopTenLists = new Meteor.Collection("toptenlists");

Meteor.publish('songs', function (listkey) {
  return Songs.find({listkey:listkey});
});
Meteor.publish('playlists', function (playlist) {
  return PlayLists.find({$or:[{_id:playlist}, {user:this.userId(), saved:true}]}); 
});
Meteor.publish('playchannels', function (playchannel) {
  return PlayChannels.find({_id:playchannel});
});
Meteor.publish('latestlists', function(){
  var cursor = PlayLists.find({saved:true}, {sort:{when:-1}, limit:8})
  this._publishCursor(cursor, 'latestlists');
  return ; 
});

Meteor.publish('toptenlists', function(){
  var cursor = PlayLists.find({saved:true}, {sort:{score:-1}, limit:10})
  this._publishCursor(cursor, 'toptenlists');
  return ; 
});
Meteor.publish('profiles', function(profile){
  var cursor = Users.find(profile);
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
  addPlaychannel: function(doc){
    doc.when = Date.now(); // ms since epoch
    return PlayChannels.insert(doc);
  },  
  addSong: function(doc){
    doc.when = Date.now(); // ms since epoch
    return Songs.insert(doc);
  },    
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
  PlayChannels.allow({
    insert: function (uid, doc) {
      return true;
    },
    update: function (uid, doc) {
      var pco = PlayChannels.findOne({_id:doc[0]._id});
      if(pco && pco.user===uid) return true;
      return false;
    },
    remove: function (uid, doc) {
      var pco = PlayChannels.findOne({_id:doc[0]._id});
      if(pco && pco.user===uid) return true;
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
    update: function (uid, doc) {
      var plo = PlayLists.findOne({_id:doc[0]._id});
      if(uid === plo.user)
        return true;
      else
        return false;
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
