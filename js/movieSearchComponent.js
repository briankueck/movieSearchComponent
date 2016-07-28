/** 
 * Author: Brian M. Kueck @briankueck
 * Since we're building a web component for movies, it makes more sense to save the code into a named file... rather than into global.js.
 * Do you know about the SAW Principle? "Simple Always Wins". It's why I chose to do this in jQuery, for faster development speed of this prototype.
 * I didn't have to wire up a Node.js server, nor Gulp task runners, to build the HTML, CSS & JS code... which works in a standard .html file.
 * Now that all of the functions are built, they can be copied & pasted into $scope.foo functions in Angular 2.
 * The CSS can be ported into SASS or SCSS very easily. Instead of writing CSS code like this:
 * .movieSearchComponent .movie .title {...}
 * I'd write the SCSS code like this & omit the curly braces for SASS:
 * .movieSearchComponent {
 *   .movie {
 *     .title { 
 *       ...
 *     }
 *   }
 * }
 * I think you'll get the idea, that I know how to build amazing front-end components!
 */

movieSearchComponent = (function($) {

	/********************************************************
	 * Configuration, Constants, Data Model Section, etc... *
	 ********************************************************/

	// Note: This section would be moved into a standard $scope set of variables in Angular

	// API
	let apiKey = '42b3e60b6636f50062f6d3579100d83f';
	let apiURL = 'http://api.themoviedb.org/3/search/movie?api_key=' + apiKey + '&query=';
	let imgBasePath = 'http://image.tmdb.org/t/p/w154';

	// Configuration:
	let useAnimation = true;

	// Animation
	let animationIntervals = {};

	// For easy console.log function trace routes. These items + the traceRoute() & log() functions would be deleted from this code, before checking in. They are handy for now.
	let debug = false;
	let namespace = "movieSearchComponent";

	/** Allows for multiple timers. Simple nested JSON example. The format is: timers[key].evt & timers[key].timeout. 
	 * This allows for multiple timers in the code, which have multiple events & timeouts.
	 */
	let timers = {
		"ajaxCall": {
			"evt": null,
			"timeout": 250 // ms
		}
	};

	/******************************
	 * Alphabetized Function List *
	 ******************************/

	function addEvents() {
		traceRoute('addEvents');

		$('#movieSearchBox').on('keyup',function() {
			// Saves a reference to this search box, as the $(this) keyword will be mapped to the Window object, when inside of the following setTimeout function.
			let searchBox = $(this);

			if (searchBox.val().trim().length === 0) {
				resetAjaxDiv();
			} else {
				// This timeout prevents making repeat multiple Ajax calls when rapidly typing. It will only make 1x call after the user stops for x number of milliseconds. X is defined in the timers[key].timeout code above.
				clearTimeout(timers.ajaxCall.evt);
				timers.ajaxCall.evt = setTimeout(function(){
					let searchKey = searchBox.val();
					search(searchKey);
				}, timers.ajaxCall.timeout);
			}
		});

		$('#reset').on('click',function() {
			resetAjaxDiv();
		});

		log('Events Have Been Added. The page is listening for your response.');
	}

	/* This is the JavaScript method of adding dynamical listeners.
	 * If I wanted to use CSS, I would remove the "hidden" class which is on the overlay & then would do this: 
	 * .movieSearchComponent .movie .overlay { display: none; }
	 * .movieSearchComponent .movie:hover .overlay { display: block; }
	 */
	function addDynamicEvents() {
		traceRoute('addDynamicEvents');
		$('.movie').on('mouseover',function() {
			$(this).children('.overlay').removeClass('hidden');
		});

		$('.movie').on('mouseout',function() {
			$(this).children('.overlay').addClass('hidden');
		});
	}

	// My 6x Core Hyper-Threaded i7 (12 Core Tower Development PC) runs too fast to test out the animation to make sure that each one fades in sequentially. 
	// When I search for "Star Wars" & then delete the "Wars" and type "Trek" for "Star Trek", then I can see each set of search results fading in 1 after the other.
	function animation(key, newMovie) {
		traceRoute('animation');

		/* Trying to set up an internal JS delay, like PHP's sleep() function doesn't really work. 
		 * I'd have to rework the main search function below, to make it into a self-referencing function. 
		 * I've done that before, but I don't really want to do that right now.
		animationIntervals[key] = setInterval(function() {
			for (var i=0; i<100; i++) {
				$(newMovie).attr('style','opacity:' + i + '%;');
			}
			clearInterval(animationIntervals[key]);
		},500);
		*/

		// So we'll just stick with this jQuery fadeIn delay idea for now:
		newMovie.fadeIn("slow").delay(800);
	}

    function ajax(searchKey, fnCallback) { // Some people prefer to do things the harder way. I tend to want to do them the smarter way.
		traceRoute('ajax');

		/** Ajax engine from http://vanilla-js.com, which is smaller than the Wikipedia example at: https://en.wikipedia.org/wiki/Ajax_(programming)
		 * & definitely smaller than jQuery's 85Kb minified footprint! I've written a lot of these before from scratch & there are free examples on the web.
		 * Using an open source example is simply faster in this case, but let me point out some ideas in these engines:
		 *
		var r = new XMLHttpRequest();
		r.open("POST", "path/to/api", true);
		r.onreadystatechange = function () {
		  if (r.readyState != 4 || r.status != 200) return; // <- Unoptimized. Should be !== in both cases.
		  alert("Success: " + r.responseText);
		};
		r.send("banana=yellow");

		These are simply examples of what can be done.
		$.ajax({ // <- Too verbose for a simple Ajax call. Use $.get() for simplicity.
		  type: 'POST',
		  url: "path/to/api",
		  data: "banana=yellow",
		  success: function (data) {
			alert("Success: " + data);
		  },
		}); 

		Likewise, this Wikipedia example is too verbose. At least you know - that I know - how they work.
		I was once asked to build an Ajax engine into a banner ad's code, so that someone could enter an email 
		into the banner ad's <input> field & have it automatically send the email address back to the company. 
		I made it work, by writing a similar Ajax engine to these examples. It was a bizarre request from a marketing department, but still a fun challenge to accomplish!

		// This is the client-side script.

		// Initialize the Http request.
		var xhr = new XMLHttpRequest();
		xhr.open('get', 'send-ajax-data.php');

		// Track the state changes of the request.
		xhr.onreadystatechange = function () {
			var DONE = 4; // readyState 4 means the request is done.
			var OK = 200; // status 200 is a successful return.
			if (xhr.readyState === DONE) {
				if (xhr.status === OK) {
					alert(xhr.responseText); // 'This is the returned text.'
				} else {
					alert('Error: ' + xhr.status); // An error occurred during the request.
				}
			}
		};

		// Send the request to send-ajax-data.php
		xhr.send(null);
		*/

		$.get(apiURL + searchKey, fnCallback); // <- We're passing in a callback function, so that we can pass in different callback functions as needed.
	}

	function findMonth(key) {
		traceRoute('fixMonth');
		let months = ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'];
		let strMonth = months[parseInt(key)-1];
		return strMonth;
	}

	function fixDate(date) {
		traceRoute('fixDate');
		let list = date.split('-');
		let newDate = findMonth(list[1]) + ' ' + list[2] + ', ' + list[0];
		return newDate;
	}

	function init() {
		traceRoute('init');
		addEvents();
		$('#movieSearchBox').focus();
	}

	function randomColorForOverlay() { // Easter Eggs are fun!
		traceRoute('randomColorForOverlay');
		let randomNumber = Math.floor(Math.random() * 3) + 1; // This generates a number from 1-3.
		let colors = [null,'red','green','blue']; // So this has to be a 1 based array.
		let color = colors[randomNumber];
		if (debug) {
			log('randomNumber: ' + randomNumber);
			log('color: ' + color);
		}
		return color;
	}

	function resetAjaxDiv() {
		traceRoute('resetAjaxDiv');
		$('#ajaxResultsMovies').html('');
		$('#movieSearchBox').val('').focus();
	}

	function search(searchKey) {
		traceRoute('search');
		/** I could use promises instead of callbacks here, but developers like to argue over which is better. 
		 * Personally, I don't have a preference either way. Just as long as it works. It's like which path do you want to take around the mountain? Left or Right? 
		 * They both arrive at the same destination on the far side. Getting the code to work faster is better. We can refactor it after it works, when time allows.
		 */

		searchKey = searchKey.trim();
		log('searchKey: ' + searchKey);
		if (searchKey.length === 0) return;

		// Performs the search:
		ajax(searchKey,function(data) {
			if (!useAnimation) {
				var HTML = ''; // Loop hoisting trick. No need to process extra JS commands inside of the loop, if we aren't animating them when the are dropped into the DOM.
			}

			for (let i=0; i<data.results.length; i++) {
				if (useAnimation) {
					var HTML = ''; // We're animating 1 .fadeIn() animation at a time. So we have to drop this to the DOM first, before it can fade in. We need "var" here instead of "let".
				}

				//let newTemplate = $.extend(true, {}, template); // <- This is one of the core reasons why I want to use jQuery, but it's splitting the text into an array of characters.

				// So we have to do it this way...
				let newTemplate = $('#htmlTemplate').text().trim();
				let movie = data.results[i];
				if (movie.poster_path) {
					newTemplate = newTemplate.replace('%I%', i);
					newTemplate = newTemplate.replace('%POSTER_URL%', imgBasePath + movie.poster_path);
					newTemplate = newTemplate.replace('%TITLE%',movie.title);
					newTemplate = newTemplate.replace('%RELEASE_DATE%',fixDate(movie.release_date));
					newTemplate = newTemplate.replace('%VOTE_AVERAGE%',movie.vote_average);
					newTemplate = newTemplate.replace('%OVERLAY_COLOR_CLASS%',randomColorForOverlay()); // Easter Egg!
					HTML += newTemplate;
				}

				if (useAnimation) {
					// Drop the data into the DOM.
					$('#ajaxResultsMovies').append(HTML);

					//setTimeout(function() { <- My 12 Core i7 PC is running too fast for me to see if it's fading in sequentially. I'd have to rework this function to make it self-referencing. I don't want to do that right now. Maybe later.
						// Animate it.
						let key = movie.title.replace(/\s/g,'_').toLowerCase();
						let newMovie = $('#ajaxResultsMovies #movie-' + i);
						animation(key, newMovie);
					//}, 1000);
				}
			}

			if (!useAnimation) {
				// Drop the data into the DOM faster than using animation.
				HTML = HTML.replace(/ style="display:none;"/g,'');
				$('#ajaxResultsMovies').html(HTML);
			}

			// Wire-Up Dynamic Event Listeners
			addDynamicEvents(); // I'm just showing off at this point!
		});
	}

	// Debugging functions:
	function log(str) {
		if (debug && (typeof(console) !== 'undefined') && (typeof(console.log) !== 'undefined')) {
			console.log(str);
		}
	}

	function traceRoute(fnName) {
		if (debug) {
			log(namespace + '.' + fnName);
		}
	}

	/************************************************************************
	 * Exposes private functions (right), using public method names (left). *
	 ************************************************************************/

	return {
		"init": init/*,
		"search": search // <- Enable this if you want to do an external method search, like: movieSearchComponent.search('searchQuery'); 
		*/
	}
})(jQuery); // <- This is an example of a self-loading function. Newer Web Developers call these "immediately-invoked function expressions (IIFEs)". Short = Sweet!

// Now for my amazing auto-init section!
movieSearchComponent.init(); // <- I could put this into the <script> tag in the index.html file, but if this file is ever deleted then that page would break. It's better to leave it here, so that we don't have to fix bugs in the future.