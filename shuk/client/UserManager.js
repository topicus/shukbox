(function(window){

	function UserManager(){
		var that = this;
		var login_interval;
		this.login = function(type){
		  if(type==='facebook'){
		    Meteor.loginWithFacebook(); 
		  }else if(type==='google'){
		    Meteor.loginWithGoogle();
		  }  
		  Meteor.logout(function(){
		    that.login_interval = Meteor.setInterval(that.waitForLogin, 500);
		  });
		};
		this.waitForLogin = function(){
			if(Meteor.user() && typeof(Meteor.user().anonym)==='undefined'){
				Meteor.clearInterval(that.login_interval);
				that.getFullUser();			
			}
		};		
		this.logout = function(){
			Meteor.logout(function(){
				Session.get('fulluser', null)    
			});		
		};	
		this.getFullUser = function(){
		    Meteor.call('getUserServiceId', function(error, result){
		    	if(typeof(error) ==='undefined'){
		    		Session.set('fulluser',result);
					var playlist = PlayLists.findOne(Session.get('listkey'));
					var name = (playlist.name)? playlist.name : "Anonym"
					Meteor.call("addActivity", {user_obj:Session.get('fulluser'), action:"listened to", resource:name});		    		
		    	} 
		    });
		};
		this.loginAsAnonym = function(){
			if(!Meteor.user()){
				var username = 'anonym'+Meteor.uuid();
				var password = Meteor.uuid();

				Meteor.createUser({username:username, password:password}, {anonym:true}, function(r){
					Meteor.loginWithPassword(username, password);

					playManager.newList();
				});
			}  
		};	
	}
	window.UserManager = UserManager;
})(window);