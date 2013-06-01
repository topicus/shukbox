Meteor.startup(function () {
  Meteor.users.allow({
    update:function(uid, doc){
      return true;
    }
  });

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
      var so = Videos.findOne({_id:doc._id});
      var plo = PlayLists.findOne({_id:so.listkey});
      if(plo && plo.user===uid)
        return true;
      else
        return false;
    }
  });
  PlayLists.allow({
    insert: function (uid, doc) {
      console.log("INSERT ALLOW PLAYLIST");
      return true;
    },
    update: function (uid, doc, fields, modifiers) {
      console.log("UPDATE ALLOW PLAYLIST");
      var plo = PlayLists.findOne({_id:doc._id});
      var perms = ['score', 'voters'];
      if(uid === plo.user || publicFields(perms, fields)){
        return true;
      }else{
        return false; 
      }
    },
    remove: function (uid, doc) {
      console.log(doc._id);
      var plo = PlayLists.findOne({_id:doc._id});
      if(plo && uid === plo.user){
        Videos.remove({listkey:doc._id});
        return true;
      }else
        return false;
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
