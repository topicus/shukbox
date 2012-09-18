(function(window){

	function PlaylistManager(){
		var that = this;
		
		this.newList = function(temp){
			saved = typeof temp !== 'undefined' ? temp : false;
			if(Meteor.user()){
				console.log(Meteor.user());
			    var name = 'Untitled-list';
			    Meteor.call('addPlaylist', {name:name, user:Meteor.user()._id,saved:saved, blocked:false}, function(error,response){
					if(Meteor.user())
					Session.set('owner', Meteor.user()._id);                      
					Router.setList(response);
			    });    
			}
		};		
		this.setList = function(listkey){
			Router.setList(listkey);
		};		
		this.setSongToCopy = function(id){
			console.log("CALLING SONG TO COPY");
			PlaylistManager.songToCopy = id;
		};
		this.copySongToList = function(listkey){
			var song = Songs.findOne(PlaylistManager.songToCopy);
			console.log("SONG TO COPY: " + PlaylistManager.songToCopy);
			delete song._id;
			song.added_by = Meteor.user()._id;
			song.listkey = listkey;
			Meteor.call('addSong',song);
		};
		this.votePlaylist=function(listkey){
		    var vote = PlayLists.find({_id:listkey, voters:{$in:[Meteor.user()._id]}}).count();
		    if(!vote)
		      PlayLists.update({_id:listkey},{$inc:{score:1}, $push:{voters:Meteor.user()._id}});
		    return false;
		};			
	}
	PlaylistManager.songToCopy = null;
	window.PlaylistManager = PlaylistManager;
})(window);