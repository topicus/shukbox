if (window.Handlebars) {
  Handlebars.registerHelper("signedup", function() {
    var u = Meteor.user();
      if(u){
        if(Meteor.loggingIn())
          return {loading:true};
        else if(u.profile.anonym){
          return null
        }else{
          Meteor.user();
        }
      }else{
        return null;  
      }
    return Meteor.user();  
  });
  Handlebars.registerHelper('owner', function(){
    if(Meteor.user())
      return Session.get('owner') === Meteor.user()._id;
    return false;
  }); 
  Handlebars.registerHelper('page_is', function(page){
    return Session.get('page') === page;
  });   
  Handlebars.registerHelper('profile_image', function(user){
    var u = Meteor.user();
    if(u && !undef(u.profile) && !undef(u.profile.picture)){
      return u.profile.picture;
    }else{
      return '/img/avatar.png';
    }  
  });

}