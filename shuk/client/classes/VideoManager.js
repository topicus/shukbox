(function(window) {
	function VideoManager(){
		this.add = function(obj){
			console.log(obj);
			var u = Meteor.user()
				, listkey = obj.listkey || Session.get('listkey')
				, user_logged = u
				, username = (u && !undef(u.profile) && !undef(u.profile.name))? u.profile.name : "anonym" 
				, profile_image = (u && !undef(u.profile) && !undef(u.profile.picture))? u.profile.picture : "/img/avatar.png" 
				, video = {
					vid: obj.vid,
					score: 0,
					title:obj.title,
					listkey:listkey,
					added_by:{
						uid: u._id,
						name: username,
						profile_image: profile_image
					}
				};
			log("addVideo");
			Meteor.call('addVideo', video);
		};
		this.clone = function(video, listkey){
			delete video._id;
			video.voters = [];
			video.score = 0;        
			video.listkey = listkey;
			Videos.insert(video);
		};	
		this.remove = function(id){
			Videos.remove(id);
		};
	}
	window.VideoManager = VideoManager
})(window)