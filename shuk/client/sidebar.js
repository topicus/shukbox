Session.set('recents', null);

Template.recentlist.recents = function(argument) {
	getRecentsLists();
	if(typeof(error) ==='undefined') return Session.get('recents');
	return false;
};
function getRecentsLists(){
	Meteor.call('getRecentsLists', function(error, response){
		Session.set('recents', response);
	});
};