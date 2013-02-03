(function(window){

	function UserManager(){
		var that = this;
		var login_interval;
		this.login = function(type){			
			if(type==='facebook'){
				Meteor.loginWithFacebook(function(error,response){
					log('CALLBACK facebook',response);
					that.onLoginComplete();
				}); 
			}else if(type==='google'){
				Meteor.loginWithGoogle(function(error,response){
					that.onLoginComplete();
				}); 
			}else if(type==='twitter'){
				Meteor.loginWithTwitter(function(error,response){
					that.onLoginComplete();
				}); 
			}    

		};
		this.onLoginComplete = function(){
			if(Meteor.user()){
				var u = Meteor.user();
				console.log(u);
	    		if(u && undef(u.profile.picture)){
	    			that.setProfilePicture(u);	
	    		}				
			}		
		};		
		this.logout = function(){
			Meteor.logout(function(){
				that.loginAsAnonym();    
			});		
		};	
		this.loginAsAnonym = function(){
			console.log("USERMANAGER::loginAsAnonym")
			if(!Meteor.user()){
				var username = 'anonym'+Meteor.uuid();
				var password = Meteor.uuid();

				Accounts.createUser({username:username, password:password, profile:{anonym:true}}, function(e,r){
					console.log(r);
					Meteor.loginWithPassword(username, password);
					playManager.create();
				});
			}  
		};	
		this.setProfilePicture = function(user){
			console.log("set profile")
			if(!undef(user.services)){
				var s = user.services;
				var profile_picture;
				if(_.has(s, "facebook"))
					profile_picture = "http://graph.facebook.com/"+s.facebook.id+"/picture";
				if(_.has(s, "google"))
					profile_picture = "https://plus.google.com/s2/photos/profile/"+s.google.id+"?sz=30";
				
				Meteor.users.update(Meteor.user()._id, {$set: {"profile.picture": profile_picture}})
			}
		};
	}
	window.UserManager = UserManager;
})(window);