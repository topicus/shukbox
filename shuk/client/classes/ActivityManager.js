(function(window) {
	function ActivityManager(){
		this.add = function(action, resource){
			var u = Meteor.user();
			Meteor.call("addActivity", {
				user_obj:u, 
				action:"listened to",
				picture: u.profile.picture, //el activity manager lista solo los registrados  
				resource:resource.name,
				collection:"playlists", //modificar para hacer para muchos tipos de datos
				collection_id: resource._id
			});
		}
	}
	window.ActivityManager = ActivityManager
})(window);