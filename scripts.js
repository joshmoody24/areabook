
function addRippleEffect(){
const buttons = document.getElementsByTagName("button");
for(var i =0; i < buttons.length; i++){
	buttons[i].classList.add("ripple");
}
}


var app = new Vue({
	el: '#app',
	data: {
		people: [],
		message: 'Hello Vue!',
		activePerson: {name: '__Person__'},
		tabs: [
			{name:'Home', active:true},
			{name: 'Calendar', active: false},
			{name: 'People', active: false},
			{name: 'Map', active:false},
			{name: 'Sync', active: false},
			{name: "__Person__", active: false},
			{name: "Area Notes", active: false},
			{name: "Help", active: false},
			{name: "About", active: false},
		],
		hours: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM'],
		calendarEvents: [],
		newEventStartTime: "10:00",
		newEventEndTime: "11:00",
		newEventName: "",
		newEventColor: "#bbccff",
	},	
	created:  function () {
		this.parseJSON();
	},
	computed: {
		currentTab(){
			activeTab = '';
			this.tabs.forEach(tab => {
				if(tab.active) activeTab = tab;
			});
			return activeTab;
		},
		peopleOnDate(){
			return this.people.filter(person => person.daysToBaptism !== null && person.member === false);
		},
		peopleBeingTaught(){
			return this.people.filter(person => person.beingTaught === true && person.daysToBaptism === null && person.member === false);
		},
		peopleFormerlyTaught(){
			return this.people.filter(person => person.beingTaught === false && person.member == false);
		},
		members(){
			return this.people.filter(person => person.member === true);
		},
		currentDay(){
			var today = new Date();
			return this.day(today.getDay()) + ", " + this.month(today.getMonth()) + " " + today.getDate() + ", " + (today.getYear() + 1900);
		},
		currentDayNoYear(){
			var today = new Date();
			return this.day(today.getDay()) + ", " + this.month(today.getMonth()) + " " + today.getDate();
		},
	},
	methods: {
		activateTab(tabName){
			this.tabs.forEach(tab => {
				if(tabName !== tab.name){
					tab.active = false;
				} else {
					tab.active = true;
				}
			});
		},
		loadTeachingRecord(person){
			this.activateTab(this.activePerson.name);
			this.activePerson = person;
			this.tabs[5].name = person.name;
		},
		getPersonIcon(person){
			if(person.daysToBaptism !== null && person.daysToBaptism > 0 && person.beingTaught === true) return "bi bi-star-fill nonmember person-icon";
			if(person.beingTaught === false) return "bi bi-circle-fill formerly-taught person-icon";
			if(person.member) return "bi bi-circle-fill member person-icon";
			return "bi bi-circle-fill nonmember person-icon";
		},
		month(index){
			var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
			return months[index];
		},
		day(index){
			var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
			return days[index];
		},
		async parseJSON (json = null){
			if(json === null){
				let response = await fetch("./people.json");
				this.people = await response.json();
			}
			else{
				this.people = JSON.parse(json);
			}
			console.log(this.people);
			this.people = this.people.people;
			//fill in missing values with defaults
			this.people.forEach(person => {
				if(person.daysToBaptism === undefined || person.daysToBaptism < 0) person.daysToBaptism = null;
				if(person.beingTaught === undefined) person.beingTaught = true;
				if(person.daysSinceContact === undefined) person.daysSinceContact = 0;
				if(person.findingSource === undefined) person.findingSource = "other";
				if(person.name === undefined) person.name = "undefined name";
				if(person.member === undefined) person.member = false;
			});
			//sort the array so baptismal dates are first, then normal pbt, then formers, then members
			this.people.sort((a, b) => {
				namesA = a.name.split(" ");
				namesB = b.name.split(" ");
				if(namesA.length == 1) namesA = namesA[0];
				else namesA = namesA[namesA.length - 1];
				if(namesB.length == 1) namesB = namesB[0];
				else namesB = namesB[namesB.length - 1];
				return Number(b.daysToBaptism) - Number(a.daysToBaptism) ||
					Number(b.beingTaught) - Number(a.beingTaught) ||
					Number(!b.member) - Number(!a.member) ||
					namesA.localeCompare(namesB);
			});
		},
		uploadData(){
			let file = document.querySelector("#customDataUpload").files[0];
			let reader = new FileReader();
			reader.addEventListener('load', e => this.parseJSON(e.target.result));
			reader.addEventListener('error', function() {
				alert('Error : Failed to read file');
			});
			reader.readAsText(file);
		},
		addCalendarEvent(e){
			//compute duration of event in hours
			var hoursMinutesA = this.newEventStartTime.split(":");
			var hoursMinutesB = this.newEventEndTime.split(":");
			var minutesA = parseInt(hoursMinutesA[0])*60 + parseInt(hoursMinutesA[1]);
			var minutesB = parseInt(hoursMinutesB[0])*60 + parseInt(hoursMinutesB[1]);
			var duration = (minutesB - minutesA)/60;
			if(duration < 0){
				alert("Error: end time is before start time");
				return false;
			}
			else if(duration < 0.25){
				alert("Error: event must be at least 15 minutes long");
				return false;
			}
			//subtract 9 hours from start time (1 less than 10 for personal study) and scale to hours
			var scaledStartTime = (minutesA - 9 * 60)/60;
			this.calendarEvents.push({name: this.newEventName, startTime: this.newEventStartTime, scaledStartTime: scaledStartTime, endTime: this.newEventEndTime, color: this.newEventColor, duration: duration});
			this.newEventName = "";
			this.newEventStartTime = this.newEventEndTime;
			this.newEventEndTime = Number(parseInt(this.newEventStartTime.split(":")[0]) + 1) + ":" + this.newEventStartTime.split(":")[1];
			this.newEventColor = "#bbccff";
			this.disableAddMenu();
			e.preventDefault();
		},
		disableAddMenu(){
			console.log("disabling add menu");
			document.getElementById("add-calendar-event").classList.add("hidden");
		},
		enableAddMenu(e){
			console.log("enabling add menu");
			document.getElementById("add-calendar-event").classList.remove("hidden");
		},
		deleteEvent(e){
			this.calendarEvents = this.calendarEvents.filter(i => i !== e);
		},
	}
})
