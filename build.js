(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var colors = ['#018d5d', '#ba4460', '#9ea946', '#00479f', '#c26939', '#8188df', '#ee6bd4'];
var chiasmColors = {
	a: 0,
	b: 1,
	c: 2,
	d: 3,
	e: 4,
	f: 5,
	g: 6,
	h: 7
};

module.exports = function getChiasmColor(identifier) {
	var key = identifier[identifier.length - 1].toLowerCase();
	var colorIndex = chiasmColors[key];
	return colors[colorIndex];
};

},{}],2:[function(require,module,exports){
'use strict';

var oneToManyZip = require('one-to-many-array-zip');
var withinRange = require('multi-part-range-compare');

module.exports = function combineStructureAndVerses(structure, verses) {
	return oneToManyZip(structure, verses, function (_ref, verse) {
		var range = _ref.range,
		    introduction = _ref.introduction;

		var rangeStart = introduction ? introduction.range[0] : range[0];
		var rangeEnd = range[1];

		return verse.type !== 'verse' || withinRange(rangeStart, rangeEnd, verseReference(verse));
	}).map(function (_ref2) {
		var section = _ref2.one,
		    verses = _ref2.many;
		return Object.assign({}, section, { verses: verses });
	});
};

function verseReference(_ref3) {
	var chapterNumber = _ref3.chapterNumber,
	    verseNumber = _ref3.verseNumber,
	    sectionNumber = _ref3.sectionNumber;

	return [chapterNumber, verseNumber, sectionNumber];
}

},{"multi-part-range-compare":5,"one-to-many-array-zip":6}],3:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var withinRange = require('multi-part-range-compare');

module.exports = function extractRangeFromVerses(verses, range) {
	var _range = _slicedToArray(range, 2),
	    rangeStart = _range[0],
	    rangeEnd = _range[1];

	var matching = [];

	var insideMatchingRange = false;
	var hitEndOfRange = false;
	verses.forEach(function (chunk) {
		if (!hitEndOfRange) {
			var chapterNumber = chunk.chapterNumber,
			    verseNumber = chunk.verseNumber,
			    sectionNumber = chunk.sectionNumber;

			var isAnActualVerse = chunk.type === 'verse';

			if (isAnActualVerse) {
				var currentVerseIsInRange = withinRange(rangeStart, rangeEnd, [chapterNumber, verseNumber, sectionNumber]);

				hitEndOfRange = insideMatchingRange && !currentVerseIsInRange;
				insideMatchingRange = currentVerseIsInRange;
			}

			if (insideMatchingRange) {
				matching.push(chunk);
			}
		}
	});

	return matching;
};

},{"multi-part-range-compare":5}],4:[function(require,module,exports){
'use strict';

var combineStructureAndVerses = require('./combine-structure-and-verses');
var revelation = require('pickering-majority-text-revelation');
var makeMainView = require('./view');

var verses = revelation.versesNoteReferencesAndHeaders.map(function (chunk) {
	return chunk.type === 'end paragraph' ? { type: 'paragraph break' } : chunk;
}).filter(function (chunk) {
	return chunk.type !== 'start paragraph';
}).map(function (verseChunk) {
	if (verseChunk.type !== 'verse' || /^\u2014/.test(verseChunk.text)) {
		return verseChunk;
	}

	return Object.assign({}, verseChunk, { text: ' ' + verseChunk.text });
});

var structure = require('./structure');

var structuredText = combineStructureAndVerses(structure, verses);

console.log(structuredText);

var component = makeMainView({ targetSelector: '#verses', structuredText: structuredText });

},{"./combine-structure-and-verses":2,"./structure":11,"./view":16,"pickering-majority-text-revelation":7}],5:[function(require,module,exports){

const LESS_THAN = -1
const WITHIN = 0
const GREATER_THAN = 1

function withinRange(rangeStart, rangeEnd, value) {
	return relative(rangeStart, rangeEnd, value) === WITHIN
}

function relative(rangeStart, rangeEnd, value) {
	if (rangeStart.length !== rangeEnd.length || rangeEnd.length !== value.length || rangeStart.length === 0) {
		throw new Error(`All values must have the same positive number of elements`)
	}

	if (compareTwoValues(rangeStart, value) === LESS_THAN) {
		return LESS_THAN
	} else if (compareTwoValues(rangeEnd, value) === GREATER_THAN) {
		return GREATER_THAN
	}

	return WITHIN
}

function compareTwoValues(target, value) {
	// For each value: if value is less than target, LESS_THAN
	// if value is greater than target, GREATER_THAN
	// if value is equal to target, go to the next number

	for (var i = 0; i < target.length; ++i) {
		let currentTarget = target[i]
		let currentValue = value[i]

		if (currentValue < currentTarget) {
			return LESS_THAN
		} else if (currentValue > currentTarget) {
			return GREATER_THAN
		}
	}

	return WITHIN
}

module.exports = withinRange

withinRange.LESS_THAN_START = LESS_THAN
withinRange.WITHIN = WITHIN
withinRange.GREATER_THAN_END = GREATER_THAN

withinRange.relative = relative

},{}],6:[function(require,module,exports){
'use strict';

module.exports = function oneToManyZip(oneArray, manyArray, compareFn) {
	assert(Array.isArray(oneArray), 'Expected first argument to be an array');
	assert(Array.isArray(manyArray), 'Expected second argument to be an array');
	assert(typeof compareFn === 'function', 'Expected third argument to be a function');

	var output = [];
	var manyIndex = 0;
	for (var oneIndex = 0; oneIndex < oneArray.length; ++oneIndex) {
		var one = oneArray[oneIndex];
		var many = [];
		output.push({
			one: one,
			many: many
		});

		while (manyIndex < manyArray.length && compareFn(one, manyArray[manyIndex])) {
			many.push(manyArray[manyIndex]);
			manyIndex++;
		}
	}

	if (manyIndex < manyArray.length) {
		throw new Error(manyArray.length - manyIndex + ' unmatched elements');
	}

	return output;
};

function assert(value, message) {
	if (!value) {
		throw new Error(message);
	}
}

},{}],7:[function(require,module,exports){
var versesNoteReferencesAndHeaders = require('./verses-note-references-and-headers.json')
var notes = require('./notes.json')

module.exports = {
	versesNoteReferencesAndHeaders: versesNoteReferencesAndHeaders,
	notes: notes
}

},{"./notes.json":8,"./verses-note-references-and-headers.json":9}],8:[function(require,module,exports){
module.exports={
	"1": "Both the translation and the comments are the responsibility of Wilbur N. Pickering, ThM PhD, ©, being based on his edition of the Greek New Testament, according to the only significant line of transmission, both ancient and independent, that has a demonstrable archetypal form in all 27 books. The Greek Text of which this is a translation, and articles explaining the preference, may be downloaded free from  www.prunch.org.",
	"2": "Whose, the Father’s or the Son’s? Probably the Son’s, but in practice it makes little or no difference. Yes, the Text says “slaves”, so this book is not intended for the merely curious.",
	"3": "The Text actually says, “with speed”. Since to God 1000 years = one day, it has only been two days!",
	"4": "Any testimony of Jesus Christ is a word of God.",
	"5": "Most, if not all, versions have ‘he saw’ (referring to John, not Jesus) and omit the rest of the verse. The manuscript evidence is seriously divided at this point. My translation reflects two of the three main independent lines of transmission, including the best one (as I see it). See 22:20, “He who testifies to these things says, ‘Yes, I am coming swiftly!’ Oh yes!! Come Lord Jesus!” The whole book is what Jesus Christ is testifying, is revealing; as an eye witness. So the whole book is inspired.",
	"6": "John is evidently claiming divine inspiration for what he is writing. You won’t be blessed for reading or hearing a newspaper or a magazine. Notice that one person is reading (aloud) and a number of people are hearing, which was the norm in the congregations, since very few could afford to have a private copy of Scripture. Notice further that it is necessary to “keep” what is written.",
	"7": "The sequence “from..., and from..., and from...” suggests three persons. The third, “Jesus Christ”, has to be the Son. “The seven-fold Spirit” would be the Holy Spirit. So “Him who is, was and is coming” must be the Father. Just over half of the Greek MSS add ‘God’ after the first “from” to make the connection overt (but the best line of transmission does not).",
	"8": "Although the evidence is badly divided, I take it that the original reading is “the seven spirits which is”. A plural subject with a singular verb is anomalous, unless we understand “seven-fold Spirit which is”. If the Deity is three in one, why might not the Holy Spirit be seven in one? See Isaiah 11:2.",
	"9": "When and how was He “the faithful witness”? Throughout His life on earth He was the faithful witness to the Father’s character, what the Father was doing (John 5:19), what the Father was saying (John 12:50). Here He is the faithful witness to what is going to happen.",
	"10": "We have two readings here: one is clearly “from among the dead” while the other is ambiguous, meaning either “from among the dead” or ‘of the dead’. With the latter option, “firstborn” could have the derived meaning of ‘lord’ or ‘boss’. I take it that the better option is to follow the best line of transmission and read “from among”, in which case “firstborn” has its primary meaning. Death is pictured as a huge womb, pregnant with all the dead, and Jesus Christ was the first one out, literally the “firstborn”—but only the first! Because Jesus conquered death, we too may emerge from that ‘womb’. Thank you Lord!",
	"11": "Satan has been demoted—see John 12:31.",
	"12": "What was the function of a priest? A priest was a go-between, representing the people to God. I would say that intercessory prayer is a priestly function.",
	"13": "The soldier who actually pierced His side on the cross, and the religious leaders who brought the situation about, are presumably in Hades. I take it that we are being told that the dead will also see Him when He returns to reign. The human spirit is indestructible, so those in Hades are very much ‘aware’ (Luke 16:22-31).",
	"14": "That is how people used to talk—you may prefer ‘Yes, indeed!’ or ‘Even so, amen!’ The certainty that all tribes will beat their breasts is being emphasized.",
	"15": "To be the first and the last you have to be the biggest, all the time.",
	"16": "In verse 8 the Father speaks, putting His weight behind what is being written.",
	"17": "“The tribulation and kingdom and endurance”—that there is only one definite article for the three nouns presumably indicates that the three are regarded as a single package. To participate in the Kingdom in this life involves tribulation and requires endurance.",
	"18": "Presumably the witness that John gave about Jesus Christ. As in this verse, the human authors frequently alternated ‘Jesus Christ’ and ‘Christ Jesus’—so far as I can see, it was merely a stylistic devise to reduce repetition.",
	"19": "There is no definite article with “spirit”, so to capitalize the word is arbitrary. It could refer to the Holy Spirit, but I think it more likely that it refers to John’s spiritual condition (see 4:2 below).",
	"20": "It was at that point that he turned.",
	"21": "The Lord Jesus referred to Himself as “the Son of the Man”, always with the two definite articles, but here there are no articles (in the Greek). John saw a human like form, very different from the Jesus he had known.",
	"22": "Since the figure was clothed, the nipples would not be visible, so the point is presumably to give the position of the belt—across the middle of the chest. Since no further mention is made of the belt, in the letters, it is hard to know what purpose it served. But see 15:6 below.",
	"23": "A low (or loud) roar that pervades the atmosphere—it is awesome, and you can’t get away from it.",
	"24": "Comparing this with verse 14 it is evident that only the part of the head covered by the hair was white, the face (probably no beard) was like the sun.",
	"25": "But He had seven stars on that hand! Presumably the stars were on His open hand, so He rested the back of His hand on John. Since the seven stars represented the messengers of the seven churches, what might the symbolism be? Since the seven churches, taken together, represent the total Church (presumably), perhaps the glorified Christ is blessing John on behalf of the Church, so that he will be a blessing to that Church, in his turn.",
	"26": "Oh praise God! Satan used to have the keys, Hebrews 2:14, but now Jesus has them, because He did indeed vanquish the devil.",
	"27": "In verse 8 the Father guarantees the veracity of the prophecy; here the Son, who conquered death and lives forevermore, does the guaranteeing.",
	"28": "I take it that the precise form of the original Text here has the effect of affirming the certainty of the coming events. This verse is often taken as giving the outline of the book: “what you saw” = chapter 1; “things that are” = chapters 2-3; “things to come” = chapters 4-22.",
	"29": "The Greek word  may mean messenger or angel (they are often messengers). Since 2:20 below says “your wife”, referring to the messenger, we should presumably understand ‘messenger’ here as referring to a man. It is possible that messengers from these churches were visiting John, on Patmos, or had visited him earlier.",
	"30": "These letters have received a variety of ‘interpretations’. The basic meaning is obviously the literal one—these were actual churches at the time that John wrote, and each one was exactly as described in its letter. By way of application, these churches may also be taken as symbolic—at any given moment throughout the history of the Church local churches may be found to be similar in character to any one of these seven. It is also possible to see these seven churches as prophetic of the general course of the Church through time, and in that event we are presumably in the last or Laodicean age.",
	"31": "Christ’s walking about in the midst of the churches is not an aimless meandering; He is observing and evaluating.",
	"32": "Evidently it is possible to test the validity of someone’s claim to be an apostle—I wish we had been told how to do it.",
	"33": "Ouch!",
	"34": "They had not taken a sudden fall, they had drifted from their moorings, a process so gradual that it may go unnoticed for quite some time. It can happen to us too.",
	"35": "In fact, Ephesus did lose its lampstand.",
	"36": "We do not know for sure who or what they were. The etymology of the word suggests ‘laity conquerors’, perhaps the beginning of the system where the clergy dominates the laity. Once someone has a ‘guaranteed’ position their lifestyle often becomes licentious.",
	"37": "That is right, just one ear. In other words, we had better pay attention!",
	"38": "At this point it becomes very clear that God is giving a general application to these letters. The first one was written to a literal church in literal Ephesus, in literal terms, but  all  of us are to pay attention to the spiritual principles and lessons involved.",
	"39": "So what happens if you don’t overcome??",
	"40": "The Tree of Life is first mentioned in Genesis 3:22-24; it must have been transplanted out of the Garden of Eden before the Flood, unless it was a replica of the original in God’s Paradise. A considerable majority of the Greek manuscripts, including the best line of transmission, have “my” God. While walking this earth the Son repeatedly referred to the Father as ‘my God’.",
	"41": "Here, and in 1:17 and 22:13, the glorified Christ calls Himself “the First and the Last”—comparing with Isaiah 44:6 we have one of several demonstrations that Jesus Christ is Jehovah [Mormons and JWs deny that He is Jehovah].",
	"42": "You had better believe that there is a ‘synagogue of Satan’ near you! Why do you suppose that 1 Peter 5:8 says to “ be vigilant ”? In our day false Christians are more of a problem than false Jews.",
	"43": "The Lord does not promise us a free ride, bed of roses, or whatever. Here they are given specific advance warning—bad times ahead. (Presumably the “days” are not solar.)",
	"44": "So what happens if you don’t stay faithful? Note that the Lord does not register any complaint against Smyrna. If you are being persecuted for your faith it tends to keep you pretty close to the Lord. Also there is no incentive to pretend.",
	"45": "Revelation 20:14 makes clear that “the second death” is the Lake of Fire. The first death is the physical one; the second is the spiritual one—eternal separation from the Creator, in whose image we are. Of course the redeemed go into eternal life, not death, so the “second death” holds no threat for them. But there is the little matter of ‘overcoming’.",
	"46": "I find the double reference to Satan here to be curious. The opposition in the spirit realm would be especially strong.",
	"47": "Why are fornication and adultery becoming more and more common in ‘Christian’ circles today? They come with idolatry—the church is riddled with humanism, relativism, materialism, spiritism, etc., false gods all. One wonders how many Christians today have a worldview that is strictly Biblical, without any admixture of the world’s values.",
	"48": "Birds of a feather flock together; if you start sinning in one area, before long it is two.",
	"49": "Notice that the pronoun changes—it is specifically against the Nicolaitans and Balaamites that He will fight.",
	"50": "“From” is literal, maybe too literal; perhaps we should render “some of” the hidden manna.",
	"51": "Our name identifies us to other people, so what good is a name that no one knows? Except that the giver knows, obviously. So maybe the private name has to do with a private relationship, between giver and receiver! Eating “hidden manna” also sounds sort of private.",
	"52": "If anyone was still in doubt as to the identity of the One who is dictating these letters, the doubt stops here.",
	"53": "Each of the seven letters begins with this phrase, ‘I know your works’. How we act reflects our world-view, what we really believe.",
	"54": "Wow, here is a church that has it all—love, faith, service, endurance—and it is growing, doing more and more! Yes, well, but, then there is the rest of the story.",
	"55": "About three fourths of the Greek manuscripts, including the best line of transmission, read “your wife” rather than ‘that woman’. The main group that reads ‘that woman’ reflects a tradition that is full of obvious corruptions, and so does not inspire confidence. The original reading is doubtless “your wife”. To have a wife the messenger must be a man, not an angel.",
	"56": "The Lord uses an emphatic possessive pronoun here—she is messing with  His  slaves.",
	"57": "Again, notice that fornication and idolatry go together.",
	"58": "If someone refuses to repent they are beyond help; judgment has to come.",
	"59": "Two thirds of the Greek manuscripts, including the most dependable group, have “her” works, not ‘their’ works. In verse 20 the Lord emphasized that they were His slaves. If the original reading is “her” works, as I believe, then what is involved here is spiritual adultery—she was not literally sleeping with a variety of men in the church. No matter how much love, faith and service there may be in a church, the Lord will not tolerate idolatry, which is spiritual adultery.",
	"60": "Literally ‘kill by death’—so how else can you kill someone if not by death? Those who are familiar with the KJV will recall the phrase ‘let him die the death’, which in the context implies execution. I take it that “her children” does not refer to her literal sons and daughters, but to her ‘spiritual children’, those who have bought into her teaching and life style. The Lord wants to eradicate her ‘genes’, as it were. But why does God not kill Jezebel herself, instead of her children? I imagine that God uses evil people, like Jezebel, to put the rest of us to the test, to see whose side we really are on. Those who go along with a ‘Jezebel’ do not really want God.",
	"61": "What we do, or do not do, not only makes a difference down here, but will also make a difference ‘up there’.",
	"62": "“Known” implies experiential knowledge. Note that the Lord links Jezebel’s teaching directly to Satan, and those who are doing it are deeply involved with him (whether or not they fully understand the implications—if they are ‘deceived’ [v. 20] then they may indeed not understand).",
	"63": "They were doing quite well, generally—see the second note with verse 19 above. So if they throw off Jezebel’s influence they will be all right.",
	"64": "“Keeps my works until the end”—it is not enough to hold to the right doctrine; the Lord wants to see us reproducing His works (John 14:12). Notice that our participation in the administration of the Millennial Messianic Kingdom is at stake.",
	"65": "The Lord is evidently referring to Psalms 2:7-9. In that event He is declaring that He is the “Son” in verse7 and that He did indeed ask for and receive the nations as an inheritance. If we are co-heirs (Romans 8:17) then we are involved in the outworking.",
	"66": "In Revelation 22:16 the Lord declares Himself to be the “morning star”. In Isaiah 14:12 Satan is called “day- star, son of the morning”, but that was what he was before he fell. The planets Venus and Mercury are the ‘morning stars’ we see in the sky at dawn. But the Lord here says the morning star. I guess we will find out what He means when we get there.",
	"67": "In 1:4 above “the seven Spirits“, which I rendered as “seven-fold Spirit”, has to do with the Holy Spirit. Here I think not—the Lord ‘has’ them like He has the seven stars. Perhaps the reference is to Isaiah 11:2.",
	"68": "“That you were about to throw away” is the reading of about 2/3 of the Greek manuscripts, including the most dependable group, as opposed to ‘that were about to die’. They had probably already stopped believing in a variety of Biblical truths and were on the verge of dumping the rest, like the theological modernist or liberal of our day. Not surprisingly, they were short on works as well.",
	"69": "See Luke 8:18.",
	"70": "The Text is very clear—the glorified Christ said “erase”. You cannot erase something that is not there! To argue that Christ is using an impossibility as a threat is to accuse Him of using language deceitfully, a form of lying— not smart! By the grace of God my name is in the Book of Life, but what happens if I don’t overcome? In all seven letters our risen Lord places heavy emphasis upon our human responsibility. God will take care of His side; we had better take a careful look at our side.",
	"71": "Comparing this statement with Jesus’ statement in Matthew 10:32-33, confessing is the opposite of denying. Since eternal destiny is at stake, the confessing/denying must involve what we are and do, not just our words. Confessing has to do with overcoming.",
	"72": "The evidence is badly divided with reference to the wording of the last half of the verse. The translation given here reflects over half of the Greek manuscripts, including the most dependable group. We are accustomed to the more balanced form, but the basic point remains the same.",
	"73": "I take it that this will happen here on earth—a pleasant prospect! Since they have been slandering us (at the very least, 2:9) this will be a welcome vindication. I imagine that at this point in history the “synagogue of Satan” includes people who claim to be Christians, but are not really. They may even be in positions of leadership (cf. Jeremiah 20:1-4).",
	"74": "There has always been tribulation and testing here and there on the earth, but to include “the whole inhabited earth” the reference must be to the Great Tribulation. How can you be “kept from the hour” if you are in the middle of it? To be protected in the middle of a situation is not the same as being kept from it. This text would appear to point toward a pre-tribulation, or pre-wrath, rapture of the Church.",
	"75": "Would the glorified Christ make an empty threat? So how does someone take our crown? How about if someone moves into a spot that you relinquished?",
	"76": "That is three names.",
	"77": "If the Lord vomits you out, where do you go? Something can only be vomited out if it is in.",
	"78": "Sounds like ‘tough’ love. The Greek word is  , not  . See Hebrews 12:6.",
	"79": "Although this text is widely used in evangelism, it is actually directed to Christians. The Lord is offering fellowship and communion to those who claim to belong to Him. Recall that the Father seeks those who will worship Him in spirit and truth (John 4:23). Many have the impression that God is hard to find or reach, but He disagrees: “You will seek me and find me, when you search for me with all your heart” (Jeremiah 29:13). The trouble is that few of us are willing to meet the condition. See also 2 Chronicles 15:2 and 16:9; also Acts 17:27.",
	"80": "Evidently He both knocks and calls. In many cultures one calls out rather than knocks [there may not be any door, or the dogs may not let you get near it], and in the Apurinã culture (an indigenous people in the Amazon jungle, among whom I lived for several years) you call the person’s name.",
	"81": "“Consider Him who endured such hostility from sinners against Himself, . . .” (Hebrews 12:3; see also verses 4- 11). He overcame, we must overcome—God is not offering a free ride.",
	"82": "Comparing this statement with Ephesians 1:19-21 and 2:6, what is the picture? Since the Son is now literally “seated” at the Father’s right hand, this promise should be taken literally. But how about right now? I take it that we are supposed to be conducting ourselves on the basis of our position in Christ, on the basis of His victory and authority—maybe this has something to do with ‘overcoming’.",
	"83": "This is a reference to 1:10 above, so it is the glorified Christ who is speaking—He is continuing His communicating (see 1:1), only now He is speaking from Heaven.",
	"84": "“After these” opens and closes the verse. ‘These’ is a pronoun, so what is its antecedent? Presumably the churches described in chapters 2 and 3 (“the things that are” referred to in 1:19). Does “after” the churches imply that they are off the scene?",
	"85": "Compare 1:10. The Voice commanded him to “come up here”—it was something John had to do; I take it that his spirit was transported to heaven. (Consider Jesus—Matthew 17:25, John 1:48; Paul—1 Corinthians 5:3-4, Colossians 2:5; Elisha—2 Kings 5:26, 6:12.)",
	"86": "The throne, not the One. 15% of the Greek manuscripts do have the One looking like a stone, but I judge that the 85% are correct.",
	"87": "Why do we have “the” twenty-four elders the first time they are mentioned? I take it that John found them to be especially impressive or interesting (perhaps he identified with them).",
	"88": "Might this picture have any connection with the promise in 3:21 above?",
	"89": "There is no definite article with “seven spirits”. I doubt that they represent the Holy Spirit.",
	"90": "The picture seems to be that the throne was not solid—the living beings moved in, through and around it; and they themselves were translucent—at least John could see that they had eyes inside as well as outside.",
	"91": "Most of the Greek manuscripts have the elders in chorus with the living beings here, but the best line of transmission has just the living beings repeating ‘holy’ endlessly, which agrees with verse nine.",
	"92": "The manuscript evidence is badly divided here, but I take it that two of the tree main lines of independent transmission, including the best one, have “holy” nine times, instead of three. Surely it is more likely that ‘nine’ would be changed to ‘three’ than vice versa. In fact, try reading “holy” nine times in a row out loud—it starts to get uncomfortable! Since in the context the living ones are repeating themselves endlessly, the ‘nine’ is both appropriate and effective. Three ‘holies’ for each member of the Trinity.",
	"93": "‘O Lord’ as in KJV is found in a very few late manuscripts. Almost all Greek manuscripts have the words “Lord”, “God” and “our”, and some 2/3 of them (including the best group) have “the Holy One”.",
	"94": "Again, how did John know that the scroll was written on both sides if it was closed? And where were the seals, all on the outside? It appears that the scroll also was not solid, or else John had laser vision.",
	"95": "The Lamb is a Lion; the Lion is a Lamb. I would say that the Lamb characterizes Christ in His first advent to this earth, while the Lion characterizes His second advent.",
	"96": "In about ¾ of the Greek manuscripts, including the best group, the gender of this relative pronoun agrees with “horns” (neuter) and not “eyes” (masculine). Perhaps the spirits were represented by both the horns and the eyes, possibly referring to power and knowledge.",
	"97": "They all fell down, but I gather that it was the elders who had harps and bowls and sang the new song (the four are saying “Holy, holy” all the time).",
	"98": "Every Greek manuscript except one, of inferior quality, reads “us”. Many modern versions follow that lone manuscript and omit the pronoun, but that leaves the transitive verb “redeem” without a direct object, so they usually supply “men” or some such thing. But the true reading is obviously “us”, so the 24 elders are among the redeemed, and they are already in heaven wearing crowns.",
	"99": "A very few late Greek manuscripts read ‘us’, as in KJV, but almost all the manuscripts read “them”. The 24 elders exclude themselves when it comes to reigning on the earth—evidently they will not be involved in the administration of the Millennial Messianic Kingdom.",
	"100": "10,000 x 10,000 = 100,000,000, so the good angels are over 100 million. If we understand correctly from Revelation 12:4 that a third of the original angels followed Lucifer in his rebellion, that means that there are some 50 million demons out there. Good grief!",
	"101": "A list of seven; what else could we add?",
	"102": "“Every creature” presumably must include more than men and angels; I take it that all mammals, at least (they have soul), including those in the sea (dolphins, whales), and quite possibly birds (eagles) will participate.",
	"103": "The living beings and the elders were prostrating themselves and getting up repeatedly.",
	"104": "The evidence is badly divided here, but I take it that two of the three main independent lines of transmission, including the best one, read as I have translated. The “Come!” was directed to the horse, not to John (since he was right there, there would be no need to address him with a thunderous roar). The same comment applies in verses 5 and 7.",
	"105": "You had better believe that that was some horse!",
	"106": "Over 80% of the Greek manuscripts do not have “and see”, as in KJV. Each of the living beings called out a horse, saying to it, “Come!”",
	"107": "A denarius was the daily wage for manual labor. To work a full day for a quart of wheat means bare survival.",
	"108": "Perhaps the oil and wine are spared for their medicinal value.",
	"109": "The Text does not say that Hades was on a horse. John is stating a fact of human existence: Hades follows death—so it has been for 6,000 years.",
	"110": "Less than 30% of the Greek manuscripts read ‘them’ for “him”, but they are followed by most (if not all) versions in English. However, it is Death that does the killing; Hades just collects the dead. The 70% are doubtless correct (involving two of the three main independent lines of transmission, including the best one).",
	"111": "‘The four horsemen of the Apocalypse’ have received quite a bit of press, off and on, but they are just the opening gambit. The really heavy stuff comes later.",
	"112": "These “souls” have evidently not yet been reunited with their bodies, which means that they have not participated in any resurrection, including the Rapture (see 3:10, 4:1 and 5:9). See notes at 7:13-14. “Of the people” excludes animals, that also have souls.",
	"113": "“Slaves” and “brothers” evidently refer to two distinct categories of people, but I don’t know the explanation (unless ‘slaves’ refers to Israel, see 7:3 below and Galatians 4:25, in which case ‘brothers’ would refer to the Church).",
	"114": "I suppose this refers to fallen angels, since a single literal star would obliterate our planet.",
	"115": "Now it starts to get heavy! I have never been in a serious earthquake, but a former colleague was, and the trauma was so severe that years later he still had trouble talking about it.",
	"116": "The wrath of God is a great leveler; the social classes all of a sudden do not make much difference—they are all trying to hide.",
	"117": "Note that it is the Lamb’s wrath—those who reject His sacrifice can look for wrath. Notice that there is no hint of repentance from the people.",
	"118": "He saw the content of chapter seven after he saw the content of chapter six, but the events described are not necessarily in chronological order. It should not be assumed that nothing else happened between the seals, or even at the same time. However, the seals are broken in sequence.",
	"119": "The Text says “the four corners” and “the four winds”. Presumably from John’s perspective the earth would look like a sphere (or a circle)—so perhaps the angels were strategically placed so as to control the whole planet. There are four basic wind patterns that influence most of the world—the north and south ‘trade winds’ and the north and south ‘prevailing westerlies’.",
	"120": "“Joseph” stands for Ephraim. Since Levi is counted here (usually he isn’t) and Joseph has two tribes, Manasseh and Ephraim, someone has to be dropped—Dan. From both Jacob (Genesis 49:16-17) and Moses (Deuteronomy 33:22) he got the least impressive ‘blessing’.",
	"121": "Linguistically speaking, in terms of the norms of language, a phrase like “the tribe of Asher” can only have one meaning, precisely the meaning that it has everywhere else in the Bible. Ezekiel chapter 37 makes very clear that ‘the ten lost tribes’ are not lost at all—God knows exactly who and where they are, and at the right moment they will be restored.",
	"122": "I take it that we should refer back to the fifth seal, 6:11—in that event those martyrs were also killed during the Great Tribulation, just earlier on. Perhaps at this point (7:13) the pre-determined number of martyrs is now complete (in 6:11 it was not).",
	"123": "John understands that the elder is offering information and tells him to go ahead.",
	"124": "Assuming a pre-Abomination-of-Desolation rapture of the Church (because of the surprise factor, but see the note at 2 Thessalonians 2:2), I take it that multiplied millions of church members will be left behind—they knew the Gospel but were never really regenerated. When they see that they have been left behind they will fall on their faces before God saying: “Oh Lord, have mercy; if I never believed before I do now!” There will be many millions of conversions in the first hours after the Rapture. People were saved in the OT without the indwelling Holy Spirit, and they will be too. But they will have to face the Beast and most of them will be martyred. Notice that they say, “Saved by our God . . . , and by the Lamb.” Apparently there is a sovereign act of God (the Father) involved here, with the blood of the Lamb as the basis.",
	"125": "How does one “serve” in this sanctuary? I suppose by worship and praise.",
	"126": "That is what the Text says, “waters”, plural. Might there be different kinds of water, or just different sources?",
	"127": "To do this, will He also remove the memories that bring the tears?",
	"128": "A ‘deafening’ silence! I wonder why. Well, there has been a lot of noise up to this point, and there will be plenty more later, so the silence acts as an emphasis by contrast. The outpouring of wrath will now build to a crescendo.",
	"129": "One gains the clear impression that the seven trumpets form the content of the seventh seal. fifth ",
	"130": "See Hebrews 8:5.",
	"131": "That is what the Text says. Just as food for thought, I would suggest that God is Spirit and has soul; a human is soul and has spirit; an angel is spirit with no soul; an animal is soul with no spirit; insects and lower forms have neither. I imagine that the reference here is to mammals in the sea (like dolphins).",
	"132": "If the springs are hit, does that include the aquifers that supply their water? If so, a third of the sweet water on the earth is ruined.",
	"133": "Over 2/3 of the Greek manuscripts, including the best group, read “eagle” rather than ‘angel’. Since the fourth living being is similar to a flying eagle, the idea here is not new.",
	"134": "Presumably an angel, and of considerable rank.",
	"135": "The Greek word appears to be composed of two morphemes, “no-depth”. Since it is a shaft or pit we presumably should understand no known or measured depth, hence ‘bottomless’. Literally, “the shaft of the no-bottom”; the familiar ‘bottomless pit’ is not a bad rendering. Since the word “abyss” occurs elsewhere without the “shaft/pit” (see verse 11, also Luke 8:31) I prefer to take it as a proper name.",
	"136": "It will not be a good time to be on the earth!",
	"137": "Evidently these are not the literal insect, but the insect came in clouds (millions of them) and was a terrible plague. Since they are lead by a high-ranking demon (as I suppose), they are probably demons. I associate Luke 8:31 with this passage—although the Lord evidently did not send those demons to the Abyss, that they kept begging Him not to shows that it was a very real possibility in their ‘minds’; they knew something that we don’t. I take it that the Lord did not send them to the Abyss at that point because He had not won the victory yet—Satan was still the god of this world and the demons were doing their thing under Satan’s authority. But now we are to act on the basis of that victory, on the basis of our position and authority in Christ (Ephesians 2:6). So how did all those demons get into the Abyss to be available for the fifth trumpet? They got there because we sent them there! I would say that sending demons to the Abyss is one of the ‘greater’ things that the Lord Jesus said we would do (John 14:12).",
	"138": "And in English, Destroyer. “Angel” covers both good and bad—this one sounds like a boss demon.",
	"139": "I find it to be curious that this voice comes from the altar [and why did the altars have horns?], which is usually associated with obtaining God’s mercy. But in this case the altar participates in the judgment.",
	"140": "Some ¾ of the Greek manuscripts, including the best group, do not have ‘two’. John was given the number.",
	"141": "Dear me! And I thought the ‘locusts’ were bad! Notice that it is the “horses” that do the killing, not the riders. I understand that China has over one hundred million armed militia, right now, but presumably not these ‘horses’. Just as in the case of the ‘locusts’, I take it that we are looking at supernatural activity here. The population of the world is reduced by one third.",
	"142": "Notice that the idols are linked to demons. Even though an image of wood presumably has no power in itself, a demon associated with it can do all sorts of damage.",
	"143": "They were totally self-centered, and therefore totally evil, malignant, under demonic control; carbon copies of the devil. They are prepared to kill, steal and use witchcraft to gain their ends, with a total disregard for others. They want sexual gratification without responsibility. No matter what God does they will not repent; they are beyond fixing. I am glad I won’t be there. Oops, wait a minute! Don’t an awful lot of people in the world today (especially in Europe and North America) already answer to this description? They have been brought up on evolutionistic, relativistic humanism; they have been taught that they are gods, to ‘do your own thing’. Hey, if we are not already there I reckon we are well on the way! A recent study found that most young people in America today are narcissists.",
	"144": "John is evidently back on earth at this point.",
	"145": "That is what the Text says, “the” rainbow; our rainbows are caused by the sun shining through rain, which was not the case here—perhaps God has a prototype.",
	"146": "Does the description remind you of anyone?",
	"147": "That is what the Text says, the seven thunders, and each had a voice and could speak intelligible words. Obviously these “thunders” exist quite apart from climactic conditions on earth. Interesting! (I suspect that what we don’t know exceeds what we think we do know, and by a considerable margin.)",
	"148": "The evidence is divided here, but I take it that two of the three main independent lines of transmission, including the best group, have “You write after these things” rather than ‘do not write them’. This text has been generally misunderstood since the beginning. Having been told to seal what the thunders uttered, why would John be told he would write it later? So many copyists altered the text, reinforcing the prohibition. However, I take it that the voice was giving two unrelated instructions: not to record the thunders; and to put his notebook aside until later—he is going to be busy interacting with the angel and eating a book, and the voice does not want him to be distracted by trying to write at the same time.",
	"149": "“The days”—the events associated with a given trumpet (and probably seal and bowl) cover a period of time; they are not instantaneous.",
	"150": "The action in verses 9-11 is presumably symbolic, but of what? Like why was the little book open, and why the stomach ache, etc.? I imagine that the book contained the prophecy mentioned by the angel, and being open would indicate that the prophecy was to be understandable. The book inside John suggests inspiration to me, and the terms of the prophecy would be mainly bitter.",
	"151": "I get the impression that the angel shifted position, probably with both feet on land—his legs had been spread or straddled, now he stands normally.",
	"152": "Comparing forty-two months with 1,260 days we get 30-day months. A year computed on the basis of these ‘prophetic’ months, as they are sometimes called, is five days shorter than a calendar year. Forty-two calendar months would give 1,277/8 days. years doesn’t sound like much fun.",
	"153": "Presumably the angel is still speaking—might He be God the Son? Could a mere angel say “my two witnesses”?",
	"154": "Note that their ‘ministry’ covers 3½ years; the Text does not actually say that it will be simultaneous with the trampling of the holy city, but I imagine that it will come close. When I see the perversity in the world I am sometimes tempted to wish I could do what they are going to do, until I get to the ‘sackcloth’—walking around in sackcloth for 3",
	"155": "See Zechariah 4:3,14.",
	"156": "They have the authority to do these things, but it is discretionary; it is up to them to decide when, where, and how much.",
	"157": "This would seem to confirm that the “locusts” and their king, in chapter nine, are on Satan’s side. That is also where Satan will be confined during the Millennium (20:3). If this beast is not Abbaddon he is presumably another high ranking demon, or so I thought until I got to 13:1 and 17:8, which see.",
	"158": "Over 99% of the Greek manuscripts have “their” Lord, not ‘our’ as in KJV and NKJV. If these two “olive trees” are the ones in Zechariah 4:3 and 14, then the “L ORD  of the whole earth” there is Jehovah the Son.",
	"159": "We might expect “Sodom and Egypt” to apply to Rome, rather than Jerusalem, but the Lord was crucified in Jerusalem.",
	"160": "People in past generations had trouble imagining how this could happen, but with modern technology people around the world will watch those corpses.",
	"161": "They will celebrate, but not for long!",
	"162": "At least they are no longer pretending that God does not exist.",
	"163": "“Slaves” and “saints”—again we seem to have two distinct categories.",
	"164": "One gets the impression that the elders had been waiting for this day. I think I know how they feel—the destruction of “those who have corrupted the earth” cannot come too soon to suit me.",
	"165": "Presumably this is the original ark of which the one made under Moses’ supervision was a copy (Hebrews 8:5, Exodus 25:9, 40, Hebrews 9:23).",
	"166": "If this were all there was to the seventh trumpet it would be anticlimactic, ‘small potatoes’. I take it that the seven ‘bowls’ (see chapter 16) give the full content of the third woe.",
	"167": "Just as Michael is the boss-angel in charge of Israel, as a nation (Dan. 10:21, 12:1), presumably each tribe has its own boss-angel (lower in rank than Michael). Assuming that the woman represents Israel, I imagine that these ‘stars’ are the tribal angels (because of the number twelve).",
	"168": "It is generally understood that this refers to those angels who joined Lucifer in his rebellion—note that verse 7 refers to the dragon and his angels. If the 2/3 are over 100 million (5:11) then this 1/3 must be over 50 million—more than enough trouble to go around.",
	"169": "That is what the Text says. Since “Son” is obviously masculine, adding “a male” emphasizes the gender. What the first man lost the second Man (1 Corinthians 15:47) recovered; the first man allowed his wife to lead, the second Man will rule with a rod of iron.",
	"170": "Here the Child is clearly identified as the Messiah—since He was born some 2,000 years ago we are obviously looking at an historical parenthesis. The rebellion of Lucifer and his angels goes back at least 6,000 years. We do not normally associate ‘shepherd’ with ‘a rod of iron’—the Millennial Messianic Kingdom will be a benevolent dictatorship.",
	"171": "Verses 1-5 are historical, but verse 6 brings us back to the Great Tribulation. The narrative is interrupted to give us some background.",
	"172": "The dragon knew that Michael had received the order, so he decided to get in the first blow.",
	"173": "“Into the earth”, including its atmosphere. The idea seems to be that at this point Satan is confined to this planet. From the content of the following verses I take it that Satan’s expulsion occurs in the middle of the seven-year period. So he is still in heaven accusing us (accusing us of what? There would be no point in bringing false accusations, so we must be providing Satan with ‘ammunition’—not a nice thought!).",
	"174": "Wait a minute! If it is only “Now”, where have the Kingdom and Authority been in the meantime? As long as a government is being challenged, its rule is not complete or tranquil. I find it instructive that Satan still has sufficient power to wage war, in Heaven!",
	"175": "“Our brothers”—I wonder who is speaking, since the ‘brothers’ are saved by the blood of the lamb.",
	"176": "That is what the Text says. Comparing 6:11 and 7:13, perhaps it is necessary for a certain number of God’s servants to be willing to die for the Cause to bring about the accuser’s expulsion.",
	"177": "It is the inhabitants that do the rejoicing, not the place.",
	"178": "Only two very late Greek manuscripts add “Christ”, as in KJV and NKJV. Over 99% do not. The dragon will persecute Jews in general and Christians in particular.",
	"179": "Less than 10% of the Greek manuscripts have ‘he’ (presumably referring to the dragon). The difference is between  (I stood) and ECTA H (he stood)—it would be easy to drop off the final N, especially since it is similar to H (more so in handwriting).",
	"180": "I am not sure that this beast is the same as the one in 11:7—they are said to come from different places (but see 17:8).",
	"181": "There is a family resemblance—seven heads, ten horns; might the Beast be the son of the Dragon? (Imitating God is Satan’s ‘thing’.)",
	"182": "I take it that here and in verse 7 it is God who does the giving—this is part of the Plan.",
	"183": "Compare 1 Corinthians 3:16. We are the ‘temple’ of God; those who dwell in Heaven are His tabernacle.",
	"184": "1 Peter 1:20 makes clear that it was actually before the foundation of the world. God knew what was going to happen before He created the human race, the terrible price He would have to pay, but He went ahead anyway.",
	"185": "Two of the three main independent lines of transmission (including the best one) so read. The third line reads, ‘If anyone goes away into captivity . . .’—the second half of the conditional clause (the apodosis) is missing. The rendering of KJV and NKJV reflects a very few late manuscripts. But what does the Text mean? Anyone who has been appointed to captivity will certainly be taken away.",
	"186": "I confess that this sentence puzzles me. Well, if I believe that my God is Sovereign over all, that He knows what He is doing, and that He has my ultimate wellbeing in view (Romans 8:28), then I will endure in faith.",
	"187": "“My own  people ”—two of the three main independent lines of transmission (including the best one) so read. Since John is speaking (writing), his physical people would be the Jews, while his spiritual people would be the Christians. The use of “own” points toward the physical, which accords with the information given elsewhere (Daniel 9:27) that Israel makes a deal with the Beast.",
	"188": "Worship an image or be killed—how humiliating! It sounds like a re-run of Daniel 3.",
	"189": "I find this verse difficult to translate. The main verb has two basic meanings: ‘to calculate’ and ‘to vote’. Since the number is immediately provided, what is there to calculate? In the context, any wise person will vote against the number, that is, refuse to receive it, but the idea of ‘against’ is not stated. The number itself is represented by three letters (in Greek), the middle one looking rather like a snake. (Some versions write out the number, but since it has to fit on forehead or hand, just the three letters seems more likely.) Note that the number is 600 plus 60 plus 6, not 6 plus 6 plus 6.",
	"190": "Is this group different than the one in chapter 7?",
	"191": "Only 2% of the Greek manuscripts do not have “His name and” (as in KJV and NKJV), so they had two names written, the Father’s and the Son’s—much better than having the name of the Beast!",
	"192": "Evidently John is finding it difficult to describe exactly what he heard, doubtless different from the normal sounds of this earth.",
	"193": "All the pronouns are masculine, so these are male virgins.",
	"194": "Two of the three main lines of independent transmission (including the best one) read “by Jesus”.",
	"195": "Why “firstfruits”? Before the advent of refrigeration, food could be preserved by drying, smoking, salting, etc., but by the time of the next harvest, nothing would compare with a firstfruit, which would be something special. Those men were special!",
	"196": "These are remarkable men! KJV and NKJV add “before the throne of God”, following the TR which is here based on only two very late manuscripts.",
	"197": "Of all the people who have ever lived on this earth, what percentage of them ever heard that Jesus died for them? Romans 1:18-21 gives the essence of God’s requirement: the evidence of creation demands a Creator, and He expects people to acknowledge Him and try to please Him.",
	"198": "As fresh, pure water becomes more and more scarce, the springs of water will become increasingly important.",
	"199": "Why “rage”? Her fornication was violent and compulsive, also insatiable.",
	"200": "To actually serve as a warning, this would have to be contemporary with 13:16.",
	"201": "Believe me, you do not want to submit to the Beast in any way! Don’t let anyone put anything on your right hand or on your forehead. Better to be executed. I do not doubt that the Beast is already alive on the earth, with age and preparation sufficient to take center stage at any moment.",
	"202": "I would say that the two “here”s are cataphoric, referring forward to the content of verse 13.",
	"203": "That is roughly 180 miles! If some four billion people will be killed during the seven-year period [mostly the second half of it] (as I calculate, a low estimate) and we allow an average of one gallon of blood per person, that is four billion gallons of blood—which would make quite a river! If the “winepress of God’s terrible fury” described here represents sort of a summary of the blood shed during the Great Tribulation period, then the picture is not far fetched. Of course a winepress has a single outlet and the liquid is conveyed to the receptacle by a conduit of appropriate size. In this case the conduit is 180 miles long and the flow is about four feet (1.33 yards) deep—four billion gallons equals about 20 million cubic yards; 180 miles equals about 320 thousand linear yards; so we have about 62.5 cubic yards of blood per linear yard of conduit—so the conduit is about 45 yards wide. My purpose in conducting this exercise is simply to show that the description of the “winepress of God’s terrible fury” is not at all ridiculous—it is a graphic but factual picture of the coming bloodbath.",
	"204": "I take it that this is a generic cover statement, referring to the detailed description that follows. I further take it that these ‘bowl’ plagues relate to the seventh trumpet (11:15) and make up the third ‘woe’ (11:14).",
	"205": "These people were martyred by order of the Beast, so how did they ‘prevail’ over him? By refusing to bow to him they escaped from hell (14:11); they died physically but won spiritually (but see 12:11).",
	"206": "KJV and NKJV read ‘saints’ instead of “nations”, following the TR which is here based on only two very late manuscripts.",
	"207": "The best line of transmission has “heaven”, all the rest having the expected ‘sanctuary’. At first glance the context seems to call for ‘sanctuary’; so much so that if ‘heaven’ were original some might have omitted while others made the obvious change—if ‘sanctuary’ were original, why would anyone omit or change? On the other hand, there are at least three heavens, 2 Corinthians 12:2, and they may have come out of the third, into the second. This is the only mention of the tabernacle of the testimony in Revelation, so the throne of God was not there and none of the action related by John up to this point took place there—there have been several references to the temple, with angels coming out of it, but I doubt that temple and tabernacle are to be equated.",
	"208": "Just like the glorified Christ (1:13). Perhaps a belt around the chest was like ‘war paint’, part of getting ready to fight.",
	"209": "Even now a chip the size of a grain of rice is being planted under the skin of volunteers. The battery contains a substance that, if it leaks out of the chip, will produce “a foul and malignant ulcer”. Notice that ‘ulcer’ is singular, one per person, precisely those who have the ‘mark’. A word to the wise . . . .",
	"210": "The resulting stench would qualify as a plague of reasonable severity.",
	"211": "That is right. Where are people going to find water to drink, let alone for washing, etc.?",
	"212": "They are no longer pretending that God does not exist, but they refuse to submit to Him, so they have no excuse.",
	"213": "Apparently this is a different kind of darkness, evidently quite painful.",
	"214": "So what might the “clothes” be? Presumably these are spiritual clothes, perhaps having to do with our walk with God, maintaining our personal sanctity or holiness, ‘without which no one will see the Lord’. “Watch” and “guard” are up to us—watch out for and guard against the world’s values.",
	"215": "Verse 15 is an interjection from the glorified Christ.",
	"216": "Such a monstrous earthquake will doubtless produce monstrous tsunamis which could well inundate many coastal cities—between the earth and the water the destruction will be massive.",
	"217": "That would be around 90 pounds each (a Roman talent = 93.75 pounds). The surviving people are ‘punch- drunk’ by now, but the hailstones are so incredible that they provoke another round of blasphemy. Such hailstones can destroy any normal dwelling.",
	"218": "In Hebrew usage a ‘son’ of something was characterized by that something. So a ‘father’ of that something would be even more so. So when James calls God “the Father of lights” (1:17) that means that “God is light and in Him is no darkness at all” (1 John 1:5)—He is totally light. In John 8:44 the Lord Jesus says that Satan is the father of the lie, and that “there is no truth in him”—he is totally falsehood (I conclude that it is impossible for Satan to tell the undistorted truth). Here we have “the mother of prostitutes and abominations”—she is totally perverted, evil (it is impossible for her to do anything pure, clean or really good). So whom or what does the whore represent? If the kings are fornicating with her they are not trying to please God, so perhaps she is organized religion (including dead Christianity, of whatever kind). In that event organized religion is incapable of doing anything pure, clean or really good.",
	"219": "Well, the origin matches 11:7 but the description matches 13:1, so maybe the three passages refer to a single personage. If “sea” refers to human origin and “Abyss” to demonic, could it be that Satan will imitate God in producing the Antichrist?",
	"220": "Here is a strong statement of election or predestination—how else could God know what names to put in the Book? At the same time the seven letters (chaps. 2 & 3) are strong on human responsibility (including the possibility of a name being erased). Divine sovereignty and human responsibility walk side by side throughout the Bible.",
	"221": "Compare verse 13—God is in ultimate control; His Word and purpose will be fulfilled.",
	"222": "In chapter 21 the Bride of Christ is represented by a city, the New Jerusalem, but the Bride is presumably people from around the earth. Likewise the whore, represented by a city, may well involve people from around the earth. “Is the great city”—when John wrote, Rome was the ruling city.",
	"223": "Could an angel say “my” people? This may be God Himself speaking. But just how can one ‘come out’ of Babylon?—by rejecting all that she represents.",
	"224": "What God has remembered about her is her iniquities.",
	"225": "Evidently it is “my people” who are supposed to be doing this. First we must disassociate ourselves from the whore, but then we are to participate in her punishment, “double”. Only it does not say how the paying back works, and I, for one, would like to know.",
	"226": "None of her lovers charge to the rescue; they stay well clear of the action! They enjoyed the whore, but . . . . (Actually, why do men go to prostitutes? They want sex without commitment.)",
	"227": "An unidentified speaker interjects a cheerful note. It may be that “the fruit that your soul craved” had to do with the “bodies and souls of men”.",
	"228": "I guess we should not expect the merchants to be braver than the kings, now should we?",
	"229": "Perhaps this should be connected to verses 6-7, above. In that event, the judgment was pronounced in faith.",
	"230": "The whore uses sorcery, and kills God’s prophets and saints. The Lord Jesus said that the “Jerusalem” of His day killed God’s prophets, so the whore has been around for quite a while.",
	"231": "The whore’s eternal punishment is a cause for praise to God.",
	"232": "Presumably the speaker is the angel of 17:1.",
	"233": "It surprises me that an angel could or would call himself “your brother”. I don’t know what to make of it, unless this was really a human being that looked like an angel. Since the Bible records angels appearing in human form, I suppose a glorified human could appear in angelic form. Why not?",
	"234": "I don’t understand this statement either, unless it is Jesus who is testifying to the prophets, giving them their messages.",
	"235": "Well over half of the Greek manuscripts, two of the three main independent lines of transmission (including the best one) read “having names written”—presumably these names were on the diadems. I would imagine that each diadem had a name.",
	"236": "The Lord Jesus Christ paid the price for our sins all by Himself (Hebrews 1:3), and here He treads “the winepress of the fury of the wrath” all by Himself. Those who think of the Lord only in terms of ‘loving, meek, mild’ need to understand that there is a whole lot more to the story. Those who reject His sacrifice can look for “the fury of the wrath”—none of us can understand how terrible was the price the Son had to pay, and He will not take kindly to having that price despised!",
	"237": "It is mainly birds of prey and scavengers that fly high in the sky; songbirds and game birds usually stay fairly close to the ground (except when migrating).",
	"238": "Apparently these are the first two residents in the Lake, and they will have it all to themselves for a full one thousand years!",
	"239": "If the Captain did all the killing, then His followers were just along for the ride. Evidently all the Captain had to do was speak.",
	"240": "The birds will eat all they can, but there will presumably be plenty of flesh left over. Ezekiel 39:12 says it will take seven months to cleanse the land of all the remains!",
	"241": "Well over half of the Greek manuscripts, two of the three main independent lines of transmission (including the best one), contain this clause. Since both the TR and the so-called critical text omit it, most versions do not include it.",
	"242": "If language has any verifiable meaning at all, this passage is obviously talking about a literal period of one thousand years.",
	"243": "What cultures in our day practice beheading?",
	"244": "Verse six makes clear that this part of verse 5 is parenthetical. It is participants in the first resurrection who will reign the thousand years; so that first resurrection must happen at the beginning of the thousand years, not the end; so “the rest of the dead” are the lost who will participate in the resurrection unto condemnation (call it the second resurrection), after the Millennium. Superficial readings of this passage have given rise to all sorts of confusion.",
	"245": "During the Millennium there will be a population explosion. Since the government will be dictatorial, everyone will have to obey outwardly, but Satan will have no trouble raising an army of ‘dissidents’.",
	"246": "The picture here is different from the battle of Armageddon—compare 19:21.",
	"247": "Doubtless the Face was full of wrath—at that point there will be absolutely no place to hide.",
	"248": "Less than 10% of the Greek manuscripts read ‘God’ instead of “throne”, as in AV and NKJV.",
	"249": "I confess that I don’t understand this; how can Death be holding dead that are not in Hades? Perhaps they are regarded as partners. But then, how can the ocean have a separate roster of dead?",
	"250": "Twice it says that they will be judged on the basis of their works. So how can you really evaluate someone’s deeds? Only by taking account of their context. Those who never heard the Gospel will be judged within the context that they lived, and the Judge will prove that even within their own context they did not measure up.",
	"251": "The first death is the physical one; the second is the spiritual one—eternal separation from the Creator (the essence of death is separation). Death and Hades are treated as if they were living entities.",
	"252": "That is right; since no one can be saved by their works, the only way out is the Book of Life!",
	"253": "“The first earth”, not the second, or whatever. This statement would seem to go against the ‘gap’ theory in Genesis 1:1.",
	"254": "Apparently there will be no water in the new earth; I take it that our glorified bodies will require neither food nor drink (so there will be no body waste to dispose of).",
	"255": "Without the separation of death, without pain and sorrow, there will be no occasion for tears.",
	"256": "Since the last throne mentioned is the Great White Throne, and since all judgment has been committed to the Son (John 5:22), I conclude that the speaker is Jehovah the Son.",
	"257": "“These word s  are true and faithful”—the guarantee extends to the individual words. If a word is true, then it cannot be false; if a word is faithful, then it cannot be designed to deceive us. Conclusion: the words of this book are to be taken at face value, according to the norms of language.",
	"258": "“I have become”—this seems awkward, so a small minority of the Greek manuscripts changed it to the familiar ‘It is done’. But in order to be the Boss at both the beginning and the end, you have to be the greatest, and survive all challenges. All human history has been involved in Satan’s challenge of that supremacy. Because of that challenge, and because only at this point has that challenge been definitively put down, Jehovah the Son says, “I have become”.",
	"259": "Does it surprise you that “cowardly” is in this list? In Matthew 10:32-33 we read: “Everyone who will confess me before men, I will also confess him before my father who is in the heavens. But whoever should deny me before men, I will also deny him before my Father who is in the heavens.” See also Luke 12:8-9 and 1 John 2:23. Presumably the Lord is referring to our attitude in the face of opposition or persecution. Anyone who caves in under pressure and disowns the Lord is out.",
	"260": "Both the TR and the so-called critical text omit “and sinners”, so most versions do as well, but two of the three main independent lines of transmission (including the best one) have the phrase.",
	"261": "That is what the Text says; instead of the noun ‘liar’ we find the adjective “false” (all the preceding descriptions are nouns, with one participle = “abominable”).",
	"262": "Actually the Text has “and”—John saw the visions in this order, but they will not necessarily happen in this order. I imagine that the New Jerusalem belongs to the Millennium (for reasons I will give below).",
	"263": "It seems to me to be unarguable that both Israel (the gates) and the Church (the foundations) participate in the New Jerusalem. (In fact, I imagine that the redeemed of all ages, up to the beginning of the Millennium, will be involved.) The rendering, “the woman [or, wife], the Lamb’s bride”, is based on over half of the Greek manuscripts, two of the three main independent lines of transmission (including the best one). In Jeremiah 3:20 and Hosea 2 Israel is presented as the wife of Jehovah—but in the O.T. wherever God interacts directly with the human race it is always Jehovah the Son. Passages like Matthew 25:10, John 3:29, 2 Corinthians 11:2 and Ephesians 5:25-27, 31-32 point to the Church as the bride of Christ (who is Jehovah the Son). So here the two come together—the wife, the bride—but maintain a distinct identity (gates are one thing and foundations are another)—indeed, nowhere does the Bible ever confuse Israel and the Church (not even in Galatians 6:16, as I can demonstrate to anyone who wishes to pursue the matter). But if the Church is still a “bride”, then the wedding has not happened yet, which is my first reason for placing this scene at the beginning of the Millennium.",
	"264": "I wonder, who replaces the Iscariot? Besides the Twelve, the only one who was personally chosen by Jesus was Saul of Tarsus.",
	"265": "The evidence is badly divided here, but I take it that two of the three main independent lines of transmission (including the best one), do not add “and her wall”, which is read by most versions since both the TR and the so-called critical text so read. Two thousand years ago a city wall was a barrier to protect the city from attack, but the following context here makes clear that the wall was part of the structure. The city is a cube, like a modern high-rise, which is a recent concept in architecture. Many early copyists presumably assumed that the wall was distinct from the city and officiously altered the text. The angel measured precisely the city and her gates; see the next note.",
	"266": "Over half of the Greek manuscripts, two of the three main independent lines of transmission (including the best one), read “and twelve”—a surprising bit of precise detail. But consider—12,000 stadia, twelve gates—if the gates are evenly spaced, as seems likely, we have a thousand stadia between gates; or is it 1,001 stadia? I will argue below that each gate was one stadium wide, which nicely explains the precise number, twelve thousand and twelve!",
	"267": "The city is a cube, the total measurement being about 1,350 miles! But does it mean the circumference or is it referring to the three dimensions? If it refers to the circumference we divide by four and each side is about 340 miles long, and of course the height is also 340 miles. If we divide by three each dimension is about 450 miles. In either event, we have one incredibly large city! But because of the twelve gates and 12,000 stadia I really believe that the angel measured the circumference.",
	"268": "That is about 70 yards; since we already know that the wall is hundreds of miles high, the reference here must be to the thickness of the wall. I take it that the wall was part of the structure, like in a modern high-rise, not like a fence (with no enemies there is no need for a fence—in fact, verse 25 makes clear that even the gates will never be closed).",
	"269": "This is curious; apparently angels use the same measurement as humans. But then, with reference to things on this earth, why wouldn’t they?",
	"270": "See verse 11 above.",
	"271": "Each foundation was adorned with a different kind of stone. But how were the twelve foundations arranged, piled up or side by side? Presumably the gates were evenly spaced, with 1,000 stadia between each pair, so perhaps each such space represented an Apostle and had a different precious stone.",
	"272": "Are not doors and gates usually wider than the wall is thick? The wall here is some 70 yards thick. I propose that each pearl was 200 yards (one stadium) wide (some pearl!), but notice in verse 25 that the gates were never closed, which means that they always remained in one position, hence no wear and tear on the ‘hinges’. But imagine that we are on that tremendously high mountain with John, and that we are perpendicular to the middle of one wall and at a distance of 50 miles. We are looking at a monstrous wall 340 miles square; it merely fills the horizon. At the base of the wall, evenly spaced (some 110 miles between them), are three gates. Would a gate 200 yards wide be out of proportion? Given the size of the wall, such gates might even seem small!",
	"273": "The ‘gold’ here is evidently different from the gold we know; John does not say that it looked like gold, he says it was gold.",
	"274": "“Kings of the earth”—we are still on the earth, with kings and nations coming and going, which is my second reason for placing the New Jerusalem during the Millennium.",
	"275": "That is, defiled or profane; perhaps anything not consecrated to God.",
	"276": "Connecting this statement with 22:15, we have all sorts of nasty people outside the city. After the Millennium and the Great White Throne they will be in the Lake of fire, so if they are still circulating on this earth, it must be during the Millennium, which is my third reason. Because of 22:15 I am inclined to suppose that the New Jerusalem will rest on the earth (not be a satellite, as some argue). But if so, where? The desert east of Jordan is hundreds of miles square with very few inhabitants, and relatively plane, yet quite close to the present Jerusalem. Perhaps there.",
	"277": "So why else did you think there was an angel stationed at each gate (21:12)?",
	"278": "This river should not be confused with the one in Ezekiel 47. The present city of Jerusalem will still exist and function during the Millennium. The two rivers share certain characteristics, but are also quite different. Zechariah 14:8 may well have to do with Ezekiel 47.",
	"279": "Two of the three main independent lines of transmission (including the best one) have “of the spirits”. The familiar ‘the holy’ of the KJV is based on the third main line.",
	"280": "This is a restatement of 1:1.",
	"281": "Here Jesus Christ speaks (and so in verses 12, 16 and 18); see 1:3.",
	"282": "I wonder if John was not always sure who was a real angel and who was the Son, appearing as an angel, and so just to make sure, . . .",
	"283": "So who are the ‘dogs’? In Deuteronomy 23:18 ‘dog’ apparently refers to a male prostitute, a catamite, and is declared to be an abomination. In O.T. times dogs were scavengers and therefore unclean, and were generally looked down upon. In Jesus’ day Jews referred to Gentiles as ‘dogs’, but since many Gentiles are in the Church that is presumably not the intended meaning here. The ‘dogs’ in Matthew 7:6 react in an aggressively hostile manner against what is holy; I take it that they are people who are overtly serving evil (Philippians 3:2 may be referring to this sort of person). So who are the ‘dogs’ here? At the very least they are the unclean. Take it from there.",
	"284": "Relativism is an idol; Humanism is an idol; Materialism is an idol. One wonders how many Christians today have a worldview that is really Biblical. The world’s values are not compatible with Christ’s values. Don’t forget 1 John 2:15-16!",
	"285": "Since God the Son is speaking, I imagine that what He wants will be done!",
	"286": "“Words”, plural, includes the individual words that make up the whole. Those textual critics who have wantonly removed words from the Text, on the basis of satanically inspired presuppositions, are out. Those who interpret the Text in such a way as to avoid its plain meaning, likewise. Jehovah the Son affirms that the words are “true and  faithful ”, and He expects us to interpret them that way.",
	"287": "“The Lord Jesus Christ” is now the full name or title of Jehovah the Son."
}
},{}],9:[function(require,module,exports){
module.exports=[
	{
		"type": "note reference",
		"identifier": "1"
	},
	{
		"type": "header",
		"text": "Introduction"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 1,
		"text": "Jesus Christ’s revelation, which God gave Him to show to His slaves",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "2"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 1,
		"text": "—things that must occur shortly.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "3"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 1,
		"text": "And He communicated it, sending it by His angel to His slave John,",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 2,
		"text": "who gave witness to the word of God, even the testimony of Jesus Christ",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "4"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 2,
		"text": "—the things that He saw,",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "5"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 2,
		"text": "both things that are and those that must happen after these.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 3,
		"text": "Blessed is he who reads and those who hear the words of the prophecy, and keep the things that are written in it;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "6"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 3,
		"text": "because the time is near.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 4,
		"text": "John, to the seven churches that are in Asia: Grace and peace to you from",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "7"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 4,
		"text": "Him who is and who was and who is coming, and from the seven-fold",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "8"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 4,
		"text": "Spirit who is before His throne,",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 5,
		"text": "and from Jesus Christ the faithful witness,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "9"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 5,
		"text": "the firstborn from among the dead,",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "10"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 5,
		"text": "and the ruler of the kings of the earth.",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "11"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 5,
		"text": "To Him who loved us and washed us from our sins with His own blood",
		"sectionNumber": 4
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 6,
		"text": "—indeed, He made us a kingdom, priests",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "12"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 6,
		"text": "to His God and Father—to Him be the glory and the dominion for ever and ever. Amen.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 7,
		"text": "Take note, He comes with the clouds, and every eye will see Him, including those who pierced Him.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "13"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 7,
		"text": "And all the tribes of the earth will beat their breasts [in dismay] because of Him. Yea, verily!",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "14"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 8,
		"text": "“I am the Alpha and the Omega”,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "15"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 8,
		"text": "says the Lord God, “He who is and who was and who is coming, The Almighty.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "16"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "John is commissioned"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 9,
		"text": "I, John, your brother and companion in the tribulation and kingdom and endurance",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "17"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 9,
		"text": "in Christ Jesus, was on the island called Patmos on account of the Word of God and on account of the testimony of Jesus Christ.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "18"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 10,
		"text": "I was in spirit",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "19"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 10,
		"text": "on the Lord’s day and I heard a voice behind me, loud as a trumpet,",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 11,
		"text": "saying, “Write what you see in a book and send it to the seven churches: to Ephesus, to Smyrna, to Pergamos, to Thyatira, to Sardis, to Philadelphia and to Laodicea.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 12,
		"text": "And there I turned to see the voice that was speaking with me.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "20"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 12,
		"text": "And having turned I saw seven golden lampstands,",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 13,
		"text": "and in the midst of the seven lampstands one similar to a son of man,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "21"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 13,
		"text": "clothed down to the feet and girded at the nipples",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "22"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 13,
		"text": "with a golden belt.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 14,
		"text": "Now His head, that is His hair, was white, like wool, as white as snow; and His eyes were like a flame of fire;",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 15,
		"text": "and His feet were like fine brass, as when refined in a furnace; and His voice was like the sound of many waters;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "23"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 16,
		"text": "and He had seven stars on His right hand and a sharp two-edged sword coming out of His mouth; and His countenance was like the sun shining in its strength.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "24"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 17,
		"text": "And when I saw Him I fell at His feet as if dead. And He placed His right hand",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "25"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 17,
		"text": "upon me saying: “Do not fear. I am the First and the Last,",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 18,
		"text": "even the Living One—I became dead, to be sure, and now I am living for ever and ever! Oh yes!! And I have the keys of Death and of Hades!",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "26"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 19,
		"text": "Therefore",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "27"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 19,
		"text": "write the things that you have seen, and the things that are, and the things that are going to occur after these.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "28"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 20,
		"text": "The mystery of the seven stars which you saw upon my right hand, and the seven golden lampstands: the seven stars are the messengers",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "29"
	},
	{
		"type": "verse",
		"chapterNumber": 1,
		"verseNumber": 20,
		"text": "of the seven churches, and the seven lampstands that you saw are seven churches.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The seven letters"
	},
	{
		"type": "note reference",
		"identifier": "30"
	},
	{
		"type": "header",
		"text": "To Ephesus"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 1,
		"text": "“To the messenger of the church in Ephesus write: These things says He who holds the seven stars on His right hand, who walks about in the midst of the seven golden lampstands:",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "31"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 2,
		"text": "‘I know your works, yes the labor, and your endurance, and that you cannot stand those who are evil. And you have tested those who claim to be apostles and are not,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "32"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 2,
		"text": "and found them  to be  liars;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 3,
		"text": "and you have born up and endured on account of my name, and not grown weary.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 4,
		"text": "‘Nevertheless I have against you that you have left your first love.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "33"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 5,
		"text": "So think about from where you have drifted",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "34"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 5,
		"text": "and repent, and do the first works, or else I will come at you swiftly and remove your lampstand out of its place",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "35"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 5,
		"text": "—unless you do repent.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 6,
		"text": "But you do have this, that you hate the works of the Nicolaitans,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "36"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 6,
		"text": "which I also hate.’",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 7,
		"text": "“He who has an ear",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "37"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 7,
		"text": "let him hear what the Spirit is saying to the churches.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "38"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 7,
		"text": "To the one who overcomes",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "39"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 7,
		"text": "I will grant to eat of the Tree of Life, which is in the midst of the Paradise of my God.",
		"sectionNumber": 4
	},
	{
		"type": "note reference",
		"identifier": "40"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "To Smyrna"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 8,
		"text": "“And to the messenger of the church in Smyrna write: These things says the First and the Last,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "41"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 8,
		"text": "who became dead and came to life:",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 9,
		"text": "‘I know your works and affliction and poverty (but you are rich), and the slander of those who claim to be Jews and are not, but are a synagogue of Satan.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "42"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 10,
		"text": "Do not fear any of the things that you are about to suffer: Take note, the devil is really about to throw some of you into prison, so that you may be tested, and you will have an affliction of ten days.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "43"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 10,
		"text": "Stay faithful until death and I will give you the crown of life.’",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "44"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 11,
		"text": "“He who has an ear let him hear what the Spirit is saying to the churches. The one who overcomes will absolutely not be harmed by the second death.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "45"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "To Pergamos"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 12,
		"text": "“And to the messenger of the church in Pergamos write: These things says He who has the sharp two-edged sword:",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 13,
		"text": "‘I know your works, and where you live, where Satan’s throne is. And you hold my name fast and did not deny my faith during the days in which Antipas was my faithful witness, who was killed among you, where Satan lives.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "46"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 14,
		"text": "‘Nevertheless I have a few things against you, because you have there adepts of the doctrine of Balaam, who taught Balak to throw a stumbling block before the sons of Israel, to eat things offered to idols and to fornicate.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "47"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 15,
		"text": "Thus",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "48"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 15,
		"text": "you also have adepts of the doctrine of the Nicolaitans as well.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 16,
		"text": "Repent! Or else I will come at you swiftly and will fight against them",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "49"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 16,
		"text": "with the sword of my mouth.’",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 17,
		"text": "“He who has an ear let him hear what the Spirit is saying to the churches. To the one who overcomes I will grant to eat from",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "50"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 17,
		"text": "the hidden manna. And I will give him a white pebble, and on the pebble a new name written, which no one knows except the receiver.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "51"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "To Thyatira"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 18,
		"text": "“And to the messenger of the church in Thyatira write: These things says the Son of God,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "52"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 18,
		"text": "He who has the eyes like a flame of fire and the feet like fine brass:",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 19,
		"text": "‘I know your works",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "53"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 19,
		"text": "—the love, the faith, the service—and your endurance; in fact your last works are greater than the first.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "54"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 20,
		"text": "‘Nevertheless I have against you that you tolerate your wife Jezebel,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "55"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 20,
		"text": "who calls herself a prophetess and teaches and deceives my slaves",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "56"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 20,
		"text": "to fornicate and to eat things offered to idols.",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "57"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 21,
		"text": "I even gave her time so that she might repent, but she does not want to repent of her fornication.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "58"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 22,
		"text": "So, I am throwing her into a sick bed and those adulterating with her into great affliction, unless they repent of her works.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "59"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 23,
		"text": "And I will execute her children;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "60"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 23,
		"text": "and all the churches will know that  I  am the One who searches minds and hearts, and I will give to each one of you according to your works.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "61"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 24,
		"text": "‘Now to the rest of you who are in Thyatira I say—to as many as do not hold this teaching, those who have not known",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "62"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 24,
		"text": "the depths of Satan, as they say—I will not put any other burden on you;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 25,
		"text": "just hold fast what you have until I come.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "63"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 26,
		"text": "And as for  the one who overcomes and keeps my works",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "64"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 26,
		"text": "until the end, I will give him authority over the nations;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 27,
		"text": "and he will shepherd them with a rod of iron; they will be smashed like clay pots",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 28,
		"text": "—just as I have received from my Father.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "65"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 28,
		"text": "And I will give him the morning star.’",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "66"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 2,
		"verseNumber": 29,
		"text": "“He who has an ear let him hear what the Spirit is saying to the churches.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "To Sardis"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 1,
		"text": "“And to the messenger of the church in Sardis write: These things says He who has the seven spirits of God",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "67"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 1,
		"text": "and the seven stars: ‘I know your works, that you have a name that you are alive, yet you are dead.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 2,
		"text": "Wake up! And strengthen the remaining things that you were about to throw away,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "68"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 2,
		"text": "for I have not found your works to be fulfilled before my God.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 3,
		"text": "So remember how you have received and heard,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "69"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 3,
		"text": "and hold fast and repent; because if you do not watch, I will come upon you like a thief, and you will not know what hour I will come upon you.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 4,
		"text": "‘But you do have a few names in Sardis who have not defiled their garments, and they will walk with me in white, because they are worthy.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 5,
		"text": "The one who overcomes will thus be clothed in white garments, and I will not erase his name from the Book of Life,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "70"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 5,
		"text": "and I will confess his name before my Father and before His angels.’",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "71"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 6,
		"text": "“He who has an ear let him hear what the Spirit is saying to the churches.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "To Philadelphia"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 7,
		"text": "“And to the messenger of the church in Philadelphia write: These things says the Holy, the True, He who has the key of David, who opens and no one can shut it, except He who opens, and no one can open:",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "72"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 8,
		"text": "‘I know your works. Look, I have set before you an open door, that no one is able to shut; because you have a little strength and have kept my Word and have not denied my name.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 9,
		"text": "See, I am determining that some of the synagogue of Satan, those who claim to be Jews and are not, but are lying—yes, I will cause them to come, and to do obeisance at your feet and to know that I have loved you.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "73"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 10,
		"text": "Because you have kept my command to endure, I also will keep you from the hour of the testing that is about to come upon the whole inhabited earth,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "74"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 10,
		"text": "to test those who dwell on the earth.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 11,
		"text": "‘I am coming swiftly. Hold fast what you have so that no one may take your crown.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "75"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 12,
		"text": "The one who overcomes, I will make him a pillar in the temple of my God, and he will never again go out. And I will write on him the name of my God, the name of my God’s city—the new Jerusalem, which comes down out of heaven from my God—and my new name.’",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "76"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 13,
		"text": "“He who has an ear let him hear what the Spirit is saying to the churches.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "To Laodicea"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 14,
		"text": "“And to the messenger of the church in Laodicea write: These things says the Amen, the faithful and true witness, the Originator of God’s creation:",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 15,
		"text": "‘I know your works, that you are neither cold nor hot. I could wish you were cold or hot.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 16,
		"text": "So then, since you are lukewarm, and neither hot nor cold, I am about to vomit you out of my mouth.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "77"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 17,
		"text": "Because you say, “I am rich, even become wealthy, and have need of nothing”, and do not realize that you are the most wretched—yes, the most pitiable and poor and blind and naked—",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 18,
		"text": "I counsel you to buy gold from me, refined by fire, so that you may become rich; and white garments, so that you may be clothed, and your nakedness not be shamefully exposed; and anoint your eyes with eye salve, so that you may see.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 19,
		"text": "As many as I love I rebuke and discipline;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "78"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 19,
		"text": "so be zealous and repent!",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 20,
		"text": "‘Now then, I stand at the door and knock.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "79"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 20,
		"text": "If anyone should hear my voice",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "80"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 20,
		"text": "and open the door, I really will come in to him and eat with him, and he with me.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 21,
		"text": "To the one who overcomes I will grant to sit with me on my throne, just as I overcame",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "81"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 21,
		"text": "and sat down with my Father on His throne.’",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "82"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 3,
		"verseNumber": 22,
		"text": "“He who has an ear let him hear what the Spirit is saying to the churches.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "“The things that must happen after these”"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 1,
		"text": "After these things I looked and wow—a door standing open in the sky, and the first voice that I heard, like a trumpet speaking with me,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "83"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 1,
		"text": "saying, “Come up here and I will show you the things that must take place after these.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "84"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The Throne Room"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 2,
		"text": "And immediately I was in spirit,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "85"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 2,
		"text": "and there, a throne set in heaven (and One sitting on the throne)",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 3,
		"text": "similar in appearance to a stone,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "86"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 3,
		"text": "jasper and carnelian, and  there was  a rainbow around the throne, similar in appearance to an emerald.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 4,
		"text": "And around the throne were twenty-four thrones, and on the thrones I saw the twenty-four elders sitting,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "87"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 4,
		"text": "clothed in white robes and golden crowns on their heads.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "88"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 5,
		"text": "And out of the throne came lightnings and noises and thunders; and seven lamps of fire were burning before His throne, which are seven spirits",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "89"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 5,
		"text": "of God;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 6,
		"text": "and before the throne it was like a sea of glass, similar to crystal.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The four living beings"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 6,
		"text": "And in the midst of the throne and around the throne were four living beings full of eyes, front and back.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 7,
		"text": "The first living being was similar to a lion, the second living being was similar to a calf, the third living being had a face like a man, and the fourth living being was similar to a flying eagle.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 8,
		"text": "And the four living beings, each one of them, having six wings apiece, were full of eyes around and within.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "90"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 8,
		"text": "And they take no rest, day or night, saying:",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "91"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 8,
		"text": "“Holy, holy, holy; Holy, holy, holy; Holy, holy, holy;",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "92"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 8,
		"text": "The Lord God Almighty; He who was and who is and who is coming!”",
		"sectionNumber": 4
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The twenty-four elders"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 9,
		"text": "And whenever the living beings ascribe glory and honor and thanksgiving to Him who sits on the throne, to Him who lives forever and ever,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 10,
		"text": "the twenty-four elders fall down before Him who sits on the throne and worship Him who lives forever and ever, and they cast their crowns before the throne saying:",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 11,
		"text": "“You are worthy, our Lord and God, the Holy One,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "93"
	},
	{
		"type": "verse",
		"chapterNumber": 4,
		"verseNumber": 11,
		"text": "to receive the glory and the honor and the power, because You created all things, and by Your will they exist and were created!”",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The Lamb takes the scroll"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 1,
		"text": "And I saw upon the right hand of Him who sat on the throne a scroll, written inside and outside, sealed with seven seals.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "94"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 2,
		"text": "And I saw a strong angel proclaiming with a loud voice, “Who is worthy to open the scroll and to break its seals?”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 3,
		"text": "And no one in heaven or on earth or under the earth was able to open the scroll or to look at it.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 4,
		"text": "And I began to really weep, because no one was found worthy to open and read the scroll, or to look at it.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 5,
		"text": "So one of the elders says to me: “Stop weeping! Look! The Lion of the tribe of Judah, the Root of David, has prevailed to open the scroll and its seven seals.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 6,
		"text": "And I saw in the midst of the throne and of the four living beings, and in the midst of the elders, a Lamb standing",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "95"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 6,
		"text": "—as if slaughtered, having seven horns and seven eyes, which",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "96"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 6,
		"text": "are the seven spirits of God sent out into all the earth.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 7,
		"text": "And He went and took it out of the right hand of the One sitting on the throne!",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "A new song"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 8,
		"text": "And when He took the scroll the four living beings and the twenty-four elders fell down before the Lamb, each having harps and golden bowls full of incenses, which are the prayers of the saints.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "97"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 9,
		"text": "And they sing a new song saying: “You are worthy to take the scroll and to open its seals; because You were slaughtered, and have redeemed us",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "98"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 9,
		"text": "to God by your blood out of every tribe and language and people and ethnic nation;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 10,
		"text": "and You have made them",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "99"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 10,
		"text": "kings and priests to our God, and they will reign on the earth.”",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "All the angels"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 11,
		"text": "And I looked, and I heard as it were the voice of many angels, around the throne and the living beings and the elders. And their number was ten thousand times ten thousand and a thousand thousands,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "100"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 12,
		"text": "saying with a great voice: “Worthy is the Lamb who was slaughtered to receive the power and wealth and wisdom and strength and honor and glory and blessing!”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "101"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Every creature"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 13,
		"text": "And every creature which is in the heaven and upon the earth and under the earth, and upon the sea (the existing  places  and the creatures in them)—I heard them all",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "102"
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 13,
		"text": "saying: “To Him who sits upon the throne and to the Lamb: the blessing and the honor and the glory and the power for ever and ever! Amen!!”",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 5,
		"verseNumber": 14,
		"text": "(It was the four living beings saying the “Amen”.) And the elders fell and did obeisance.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "103"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The Lamb opens the seals"
	},
	{
		"type": "header",
		"text": "The first seal"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 1,
		"text": "And I saw that the Lamb opened one of the seven seals, and I heard one of the four living beings saying, like a voice of thunder, “Come!”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "104"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 2,
		"text": "And I looked and, wow, a white horse!",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "105"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 2,
		"text": "And he who sat on it had a bow. And a crown was given to him; and he went out conquering, that is, in order to conquer.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The second seal"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 3,
		"text": "And when He opened the second seal I heard the second living being saying, “Come!”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "106"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 4,
		"text": "And another horse went out, fiery red, and it was granted to him who sat on it to take the peace from the earth, so that they would slaughter each other; also, a huge sword was given to him.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The third seal"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 5,
		"text": "And when He opened the third seal I heard the third living being saying, “Come!” And I looked and, wow, a black horse! And he who sat on it had a pair of scales in his hand.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 6,
		"text": "And I heard a voice in the midst of the four living beings saying: “A ‘quart’ of wheat for a denarius",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "107"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 6,
		"text": "and three ‘quarts’ of barley for a denarius; but do not harm the olive oil and the wine.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "108"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The fourth seal"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 7,
		"text": "And when He opened the fourth seal I heard a voice from the fourth living being saying, “Come!”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 8,
		"text": "And I looked and, wow, a sickly pale horse! And as for the one sitting upon it, his name is Death, and Hades follows with him.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "109"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 8,
		"text": "And authority was given to him",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "110"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 8,
		"text": "over a fourth of the earth, to kill by sword and by famine and by death, also by the wild animals of the earth.",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "111"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The fifth seal"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 9,
		"text": "And when He opened the fifth seal I saw underneath the altar the souls of the people who had been slaughtered on account of the Word of God and on account of the testimony of the Lamb which they held.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "112"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 10,
		"text": "And they cried out with a loud voice saying: “How long, O Sovereign, Holy and True, until You judge and avenge our blood on those who dwell on the earth?”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 11,
		"text": "So a white robe was given to each of them, and they were told that they should rest a while longer, until both their fellow slaves and their brothers,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "113"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 11,
		"text": "who were about to be killed just like they were, should complete  the number .",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The sixth seal"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 12,
		"text": "And I saw, just when He opened the sixth seal—there was a severe earthquake, and the sun became black as sackcloth of hair, and the moon became like blood.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 13,
		"text": "And the stars of heaven fell to the earth,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "114"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 13,
		"text": "like a fig tree drops its late figs when shaken by a strong wind.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 14,
		"text": "And the sky was split, like a scroll being rolled up, and every mountain and island was moved out of its place.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "115"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 15,
		"text": "And the kings of the earth and the magnates and the generals and the rich and the mighty, and every slave and every free man, hid themselves in the caves and among the rocks of the mountains.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "116"
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 16,
		"text": "And they said to the mountains and the rocks: “Fall on us and hide us from the face of Him who sits on the throne and from the wrath of the Lamb!",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 6,
		"verseNumber": 17,
		"text": "Because the great day of His wrath has come, and who is able to stand?”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "117"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The sealed of Israel"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 1,
		"text": "And after this",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "118"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 1,
		"text": "I saw four angels standing on the four corners of the earth,",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "119"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 1,
		"text": "holding the four winds of the earth, so that no wind should blow upon the earth, nor on the sea, nor on any tree.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 2,
		"text": "And I saw another angel ascending from the sun’s rising, having the seal of the Living God. And he cried out with a loud voice to the four angels, to whom it had been granted to harm the earth and the sea,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 3,
		"text": "saying: “Do not harm the earth, nor the sea nor the trees, until we have sealed the slaves of our God on their foreheads.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 4,
		"text": "And I heard the number of those who were sealed, one hundred and forty four thousand, sealed out of every tribe of the sons of Israel:",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 5,
		"text": "From the tribe of Judah twelve thousand were sealed, from the tribe of Reuben twelve thousand, from the tribe of Gad twelve thousand,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 6,
		"text": "from the tribe of Asher twelve thousand, from the tribe of Naphtali twelve thousand, from the tribe of Manasseh twelve thousand,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 7,
		"text": "from the tribe of Simeon twelve thousand, from the tribe of Levi twelve thousand, from the tribe of Issachar twelve thousand,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 8,
		"text": "from the tribe of Zebulon twelve thousand, from the tribe of Joseph",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "120"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 8,
		"text": "twelve thousand, from the tribe of Benjamin twelve thousand were sealed.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "121"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "A multitude from the Great Tribulation"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 9,
		"text": "After these things I looked, and wow, a great multitude that no one could number, from all ethnic nations and tribes and peoples and languages, standing before the Throne and before the Lamb, clothed with white robes and  having  palm branches in their hands.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 10,
		"text": "And they shouted with a loud voice saying, “Saved by our God who sits on the throne, and by the Lamb!”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 11,
		"text": "And all the angels stood around the Throne, and the elders and the four living beings, and they fell down before the Throne, on their faces, and worshipped God,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 12,
		"text": "saying: “Amen! The blessing and the glory and the wisdom and the thanksgiving and the honor and the power and the strength to our God for ever and ever! Amen.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 13,
		"text": "And one of the elders reacted, saying to me, “Who are these that are clothed in the white robes,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "122"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 13,
		"text": "and where did they come from?”",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 14,
		"text": "So I said to him, “My lord, you know”.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "123"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 14,
		"text": "So he said to me: “These are those who come out of the Great Tribulation—they washed their robes and made them white in the blood of the Lamb.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "124"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 15,
		"text": "Therefore they are before the throne of God, and they serve Him day and night in His sanctuary.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "125"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 15,
		"text": "And He who sits on the throne will shelter them.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 16,
		"text": "They shall not hunger anymore, nor thirst anymore; the sun will absolutely not strike them, nor any heat;",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 17,
		"text": "because the Lamb who is in the midst of the throne shepherds them and leads them to springs of waters",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "126"
	},
	{
		"type": "verse",
		"chapterNumber": 7,
		"verseNumber": 17,
		"text": "of life. And God will wipe away every tear from their eyes.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "127"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The seventh seal"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 1,
		"text": "And when He opened the seventh seal there was a stillness in heaven for about half an hour.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "128"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 2,
		"text": "And I saw the seven angels who stood before God, and seven trumpets were given to them.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "129"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 3,
		"text": "And another angel came and stood at the altar, having a golden censer.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "130"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 3,
		"text": "He was given lots of incense so that he could offer it with the prayers of all the saints upon the golden altar that is before the throne.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 4,
		"text": "And the smoke of the incense with the prayers of the saints went up before God out of the angel’s hand.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 5,
		"text": "Then the angel took the censer, filled it with fire from the altar, and threw it at the earth. And there were noises and thunders and lightnings and an earthquake.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 6,
		"text": "And the seven angels who had the seven trumpets prepared themselves to trumpet.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The first trumpet"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 7,
		"text": "So the first one trumpeted, and there appeared hail and fire mixed with blood, and it [the mixture] was thrown at the earth, and a third of the earth was burned up; that is, a third of the trees was burned up and all green grass was burned up.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The second trumpet"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 8,
		"text": "So the second angel trumpeted, and something like a great burning mountain was thrown into the sea, and a third of the sea became blood.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 9,
		"text": "And a third of the creatures with souls",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "131"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 9,
		"text": "in the sea died. And a third of the ships were destroyed.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The third trumpet"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 10,
		"text": "So the third angel trumpeted, and a great star fell out of the sky, burning like a torch, and it fell upon a third of the rivers, and on the springs of waters.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "132"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 11,
		"text": "The name of the star is called Wormwood; so a third of the waters were turned into wormwood, and many people died from the waters because they were made bitter.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The fourth trumpet"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 12,
		"text": "So the fourth angel trumpeted, and a third of the sun was struck, and a third of the moon, and a third of the stars, so that a third of them was darkened; so a third of the day did not shine, and the night likewise.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 13,
		"text": "And I saw and heard an eagle",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "133"
	},
	{
		"type": "verse",
		"chapterNumber": 8,
		"verseNumber": 13,
		"text": "flying in mid-heaven saying with a loud voice, three times: “Woe, woe, woe to the inhabitants of the earth because of the remaining trumpet blasts of the three angels who are about to trumpet!” [The  trumpet]",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 1,
		"text": "So the fifth angel trumpeted, and I saw a ‘star’",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "134"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 1,
		"text": "that had fallen out of the sky to the earth. And to him was given the key to the shaft of the Abyss.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "135"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 2,
		"text": "So he opened the shaft of the Abyss and smoke went up out of the shaft, like the smoke of a burning furnace; and the sun and the air were darkened because of the smoke from the shaft.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 3,
		"text": "And ‘locusts’ exited from the smoke into the earth. And to them was given a capability just like the scorpions of the earth have capability.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 4,
		"text": "And they were told not to harm the grass of the earth, nor any green  plant , nor any tree, but only those men who do not have the seal of God on their foreheads.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 5,
		"text": "And it was designated to them [locusts], not to kill them [men] but, to torment them five months. And their torment is like the torment of a scorpion whenever it strikes a person.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 6,
		"text": "And in those days the people will seek death but not find it; they will want to die but death will run away from them.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "136"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 7,
		"text": "Now the appearance of the ‘locusts’",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "137"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 7,
		"text": "was like horses prepared for battle, and something like a golden crown was on their heads, and their faces were like human faces.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 8,
		"text": "They had hair like a woman’s and their teeth were like a lion’s.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 9,
		"text": "They had breastplates like breastplates of iron and the noise of their wings was like the noise of many chariots with horses rushing into battle.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 10,
		"text": "And, they have tails like scorpions and stingers precisely in those tails! They have the capability to hurt the populace five months,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 11,
		"text": "having as king over them the angel of the Abyss—his name in Hebrew is Abbaddon, while in Greek he has the name Apollyon.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "138"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 12,
		"text": "The first woe is past, but, two woes are still coming, after these things.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The sixth trumpet"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 13,
		"text": "So the sixth angel trumpeted, and I heard a voice from the four horns of the golden altar",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "139"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 13,
		"text": "that is before God",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 14,
		"text": "saying to the sixth angel who had the trumpet, “Release the four angels who are bound at the great river Euphrates”.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 15,
		"text": "So the four angels were released— they had been prepared for the hour and the day and month and year—so that they might kill a third of mankind.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 16,
		"text": "And the number of the mounted troops was a hundred million",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "140"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 16,
		"text": "(I heard their number).",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 17,
		"text": "And in the vision I saw the horses like this: those who rode them had breastplates of fiery red, hyacinth blue and sulfur yellow; the heads of the horses were like lions’ heads; out of their mouths came fire, smoke and brimstone.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 18,
		"text": "By these three plagues a third of mankind was killed—by the fire and the smoke and the brimstone that came out of their mouths.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "141"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 19,
		"text": "For the capability of the horses is in their mouths—and in their tails, because their tails are like snakes, having heads, and with them they do harm.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 20,
		"text": "Yet the rest of the people, those who were not killed by these plagues, did not repent of the works of their hands, so as to stop worshipping the demons, even the idols",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "142"
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 20,
		"text": "of gold, silver, bronze, stone and wood, which can neither see nor hear nor walk;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 9,
		"verseNumber": 21,
		"text": "and they did not repent of their murders or their sorceries or their fornication or their thefts.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "143"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "John eats a little book"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 1,
		"text": "I saw a mighty angel descending out of heaven,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "144"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 1,
		"text": "clothed with a cloud, and the rainbow",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "145"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 1,
		"text": "on his head; his face was like the sun and his feet like pillars of fire;",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "146"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 2,
		"text": "and he had a little book open in his hand. He placed his right foot on the sea and his left on the land,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 3,
		"text": "and he cried out with a loud voice, just like a lion roars. And when he cried out, the seven thunders uttered their own voices.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "147"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 4,
		"text": "Now when the seven thunders spoke I was about to write, but I heard a voice out of heaven saying, “Seal up the things that the seven thunders said”, and “You write after these things”.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "148"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 5,
		"text": "And the angel whom I saw standing on the sea and on the land raised his right hand to the heaven",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 6,
		"text": "and swore by Him who lives forever and ever, who created the heaven and the things in it, and the earth and the things in it, and the sea and the things in it, that there would be no further delay,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 7,
		"text": "but in the days",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "149"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 7,
		"text": "of the blast of the seventh angel, whenever he should trumpet, the mystery of God which was announced to His slaves the prophets would be finished.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 8,
		"text": "Now the voice that I heard out of heaven was speaking to me again and saying: “Go, take the little book that is open in the hand of the angel who is standing on the sea and on the land.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 9,
		"text": "So I went to the angel and said to him, “Give me the little book”, and he says to me: “Take and eat it up; it will make your stomach bitter, but in your mouth it will be as sweet as honey.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 10,
		"text": "So I took the little book out of the angel’s hand and ate it up, and it was as sweet as honey in my mouth. But when I had eaten it my stomach was made bitter.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 10,
		"verseNumber": 11,
		"text": "And he said to me, “You must prophesy again over many peoples, even over ethnic nations and languages and kings.”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "150"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The two witnesses"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 1,
		"text": "I was given a reed like a measuring rod. And the angel stood",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "151"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 1,
		"text": "saying: “Rise and measure the temple of God and the altar, and those who worship there.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 2,
		"text": "But leave out the outer court of the temple and do not measure it, because it has been given to the nations; and they will trample the holy city for forty-two months.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "152"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 3,
		"text": "And I",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "153"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 3,
		"text": "will give  authority  to my two witnesses, and they will prophesy one thousand two hundred and sixty days, clothed in sackcloth.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "154"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 4,
		"text": "These are the two olive trees, even the two lampstands that stand before the Lord of the earth.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "155"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 5,
		"text": "And if anyone wants to harm them fire comes out of their mouths and consumes their enemies. So if anyone wants to harm them he must be killed in this way.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 6,
		"text": "They have authority to shut up the sky so that no rain falls during the days of their prophecy; and they have authority over the waters to turn them into blood, and to strike the earth with every plague, as often as they wish.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "156"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 7,
		"text": "When they finish their witness, the Beast of prey that comes up out of the Abyss",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "157"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 7,
		"text": "will make war with them, overcome them and kill them",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 8,
		"text": "—and leave  their corpses in the street of the great city! (which is called Sodom and Egypt, spiritually speaking), even where their",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "158"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 8,
		"text": "Lord was crucified.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "159"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 9,
		"text": "And those from the peoples, tribes, languages and ethnic nations look at their corpses three-and-a-half days, and will not allow their corpses to be buried.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "160"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 10,
		"text": "And those who dwell on the earth rejoice over them, and they will enjoy themselves and send gifts to one another, because these two prophets tormented those who dwell on the earth.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "161"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 11,
		"text": "And after three-and-a-half days a breath of life from God entered them and they stood on their feet, and a great fear fell on those who were watching them.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 12,
		"text": "And I heard a loud voice from the heaven saying to them, “Come up here!” And they went up to heaven in a cloud, and their enemies watched them.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 13,
		"text": "And in that day there was a severe earthquake and a tenth of the city fell, and seven thousand individuals were killed in the earthquake. And the rest became fearful and gave glory to the God of heaven.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "162"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 14,
		"text": "The second woe is past. Look out, here comes the third woe!",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The seventh trumpet"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 15,
		"text": "So the seventh angel trumpeted, and there were loud voices in heaven saying: “The kingdom of the world has become the kingdom of our Lord and of His Christ, and He shall reign forever and ever!”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 16,
		"text": "And the twenty-four elders, who sit on their thrones in God’s presence, fell on their faces and worshipped God",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 17,
		"text": "saying: “We thank You, O Lord God Almighty, He who is and who was and who is coming, because You have taken up your great power and begun to reign.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 18,
		"text": "The nations were angry and your wrath came, even the time for the dead to be judged and to give the reward to Your slaves the prophets, and to the saints",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "163"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 18,
		"text": "and those who fear your name, small and great, and to destroy those who have corrupted the earth.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "164"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 19,
		"text": "And the temple of God in heaven was opened, and the ark of the covenant",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "165"
	},
	{
		"type": "verse",
		"chapterNumber": 11,
		"verseNumber": 19,
		"text": "of the Lord was seen in His temple. And there were lightnings, noises, thunderings and huge hail.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "166"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The woman, the Child, the dragon"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 1,
		"text": "A great sign appeared in the sky: a woman clothed with the sun, with the moon under her feet, and on her head a crown of twelve stars.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "167"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 2,
		"text": "And being pregnant she was crying out in labor, being in great pain to give birth.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 3,
		"text": "And another sign appeared in the sky: wow, a dragon, huge, fiery red, having seven heads and ten horns, with seven diadems on his heads.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 4,
		"text": "And its tail grabbed a third of the stars of heaven and threw them to the earth.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "168"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 4,
		"text": "And the dragon stood before the woman who was about to give birth in order to devour her Child as soon as she gave birth.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 5,
		"text": "And she bore a Son, a male,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "169"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 5,
		"text": "who would shepherd all the nations with a rod of iron.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "170"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 5,
		"text": "And her Child was snatched up to God, even to His throne.",
		"sectionNumber": 3
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 6,
		"text": "And the woman fled into the wilderness to where she has a place prepared by God, so that they may nourish her there one thousand two hundred and sixty days.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "171"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Satan excluded from heaven"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 7,
		"text": "War was declared in heaven; Michael and his angels were to wage war with the dragon; so the dragon and his angels made war,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "172"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 8,
		"text": "but he was not strong enough; neither was there any place found for him in heaven any more.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 9,
		"text": "So the great dragon was expelled, that ancient serpent, who is called Slanderer and Satan, who deceives the whole inhabited world; he was thrown into the earth,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "173"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 9,
		"text": "and his angels were expelled with him.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 10,
		"text": "And I heard a loud voice in the heaven saying: “Now the salvation and the power have come,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "174"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 10,
		"text": "even the Kingdom of our God and the authority of His Christ, because the accuser of our brothers",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "175"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 10,
		"text": "has been thrown down, who accused them before our God day and night.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 11,
		"text": "And they conquered",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "176"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 11,
		"text": "him by the blood of the Lamb and by the word of their testimony, and they did not cherish their lives,  even  up to death.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 12,
		"text": "Therefore rejoice, O heavens, yes, you who are dwelling in them!",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "177"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 12,
		"text": "Woe to the earth and the sea! Because the devil has come down to you, having great wrath, knowing that he has little time.”",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Satan persecutes the woman"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 13,
		"text": "So when the dragon perceived that he had been thrown into the earth, he persecuted the woman who gave birth to the Male.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 14,
		"text": "And to the woman were given two wings of the great eagle, so that she might fly into the wilderness, into her place, so that she might be nourished there for a time and times and half a time, from the presence of the serpent.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 15,
		"text": "So the serpent expelled water from his mouth after the woman, like a river, so as to cause her to be overwhelmed by the flood.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 16,
		"text": "But the ground helped the woman; indeed, the ground opened its mouth and drank up the river that the dragon expelled from his mouth.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 17,
		"text": "So the dragon was furious about the woman and off he went to make war with the rest of her offspring,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 12,
		"verseNumber": 17,
		"text": "those who keep the commands of God and hold the testimony of Jesus.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "178"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Various Vignettes"
	},
	{
		"type": "header",
		"text": "A beast from the sea"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 1,
		"text": "Now I",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "179"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 1,
		"text": "was standing on the seashore, and I saw a Beast of prey coming up out of the sea,",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "180"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 1,
		"text": "having seven heads and ten horns, and on his horns ten diadems and on his heads blasphemous names.",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "181"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 2,
		"text": "The beast that I saw was similar to a leopard, his feet were like those of a bear, and his mouth was like a lion’s mouth. And the dragon gave him his power and his throne and great authority.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 3,
		"text": "And one of his heads was as if it had been mortally wounded, but his fatal wound was healed. And the whole earth marveled after the Beast.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 4,
		"text": "And they did obeisance to the dragon who had given the authority to the Beast, and they did obeisance to the Beast saying, “Who is like the Beast, and who is able to make war with him?”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 5,
		"text": "And he was given a mouth speaking great things, that is, blasphemy; and he was given authority",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "182"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 5,
		"text": "to make war forty-two months.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 6,
		"text": "So he opened that mouth of his in blasphemy against God, to blaspheme His name and His tabernacle, those who dwell in Heaven.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "183"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 7,
		"text": "And it was given to him to make war with the saints and to conquer them. And authority was given him over every tribe and language and ethnic nation.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 8,
		"text": "All who dwell on the earth will do obeisance to him, whose names have not been written in the Book of Life of the Lamb slaughtered from the foundation of the world.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "184"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 9,
		"text": "If anyone has an ear, let him hear.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 10,
		"text": "If anyone has captivity, he goes away.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "185"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 10,
		"text": "If anyone kills with the sword, with the sword he must be killed. Here is the endurance and the faith of the saints.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "186"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "A beast from the land"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 11,
		"text": "Now I saw another beast of prey coming up out of the land, and he had two horns like a lamb and spoke like a dragon.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 12,
		"text": "And he exercises all the authority of the first Beast in his presence; and he started to cause the earth and those who dwell in it to worship the first Beast, whose mortal wound was healed.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 13,
		"text": "And he performs great signs, including that fire should come down from heaven upon the earth before the people.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 14,
		"text": "And he deceives my own  people ,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "187"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 14,
		"text": "those dwelling on the earth, by the signs that it was given to him to perform before the Beast, telling those who dwell on the earth to make an image to the Beast who had the sword wound and lived.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 15,
		"text": "And it was granted to him to give breath to the image of the Beast, so that the image of the Beast should actually speak, and should cause as many as would not worship the image of the Beast to be killed.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "188"
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 16,
		"text": "And he causes everyone—both small and great, both rich and poor, both free and slave—to receive marks on their right hand or on their foreheads,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 17,
		"text": "so that no one would be able to buy or sell who does not have the mark, the name of the Beast or the number of his name.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 18,
		"text": "Here is wisdom: let the one who has understanding evaluate the number of the Beast, for it is the number of man—his number is 666.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "189"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The Lamb and the 144,000"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 1,
		"text": "And wow, I saw a Lamb standing on Mount Zion, and with Him one hundred and forty-four thousand,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "190"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 1,
		"text": "having His name and",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "191"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 1,
		"text": "His Father’s name written on their foreheads.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 2,
		"text": "And I heard a sound from the sky, like the sound of many waters, and like the sound of loud thunder; and the sound that I heard was like harpists playing on their harps.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "192"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 3,
		"text": "And they sing a new song before the Throne, and before the four living beings and the elders; and no one was able to learn the song except the 144 thousand, who had been redeemed from the earth.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 4,
		"text": "These are the ones not defiled with women, for they are virgins;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "193"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 4,
		"text": "these are the ones who follow the Lamb wherever He may go. These were redeemed by Jesus",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "194"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 4,
		"text": "from among men, firstfruits for God and for the Lamb;",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "195"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 5,
		"text": "no lie was found in their mouth, for they are blameless.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "196"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Three angels"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 6,
		"text": "And I saw another angel flying in mid-heaven, having an eternal gospel to be proclaimed to those who reside on the earth—to every ethnic nation and tribe and language and people—",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 7,
		"text": "saying with a loud voice, “Fear God and give Him glory,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "197"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 7,
		"text": "because the hour of His judging has come, and do obeisance to Him who made heaven and earth, the ocean and springs of water.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "198"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 8,
		"text": "And another, a second, angel followed, saying: “It fell, it fell, Babylon the great!— she made all the nations drink of the wine of the rage of her fornication.”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "199"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 9,
		"text": "And another angel, a third, followed them, saying with a loud voice: “If anyone worships the Beast and his image, and receives a mark on his forehead or on his hand,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "200"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 10,
		"text": "really, he will drink of the wine of the fury of God, mixed at full strength in the cup of His wrath. In fact, he will be tormented with fire and sulfur before the holy angels and before the Lamb.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 11,
		"text": "So the smoke of their torment goes up forever and ever, and they have no rest day or night, those who worship the Beast and his image, and whoever receives the mark of his name.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "201"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 12,
		"text": "Here is the endurance of the saints, here those who keep the commands of God and the faith of Jesus.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "202"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 13,
		"text": "I heard a voice from heaven saying to me, “Write: ‘Blessed are the dead who die in the Lord from now on’ (“Yes” says the Spirit), ‘so that they may rest from their labors, and their works follow along with them’.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The earth is harvested"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 14,
		"text": "And wow, I saw a white cloud, and someone like a son of man was sitting on the cloud, having on his head a golden crown, and in his hand a sharp sickle.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 15,
		"text": "And another angel came out of the temple crying out with a loud voice to the one sitting on the cloud, “Thrust in your sickle and reap, for the time to reap has come, because the harvest of the earth is dry”.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 16,
		"text": "So the one sitting on the cloud swung his sickle upon the earth, and the earth was harvested.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 17,
		"text": "Then another angel came out of the temple (the one in heaven), he too having a sharp sickle.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 18,
		"text": "And another angel came out from the altar (having authority over the fire), and he called out with a loud cry to the one having the sharp sickle saying, “Thrust in your sharp sickle and gather the grape clusters of the vine of the earth, because her grapes are ripe”.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 19,
		"text": "So the angel swung his sickle at the earth and gathered the vine of the earth and threw it into the winepress of God’s terrible fury.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 20,
		"text": "And the winepress was trampled outside the city, and blood came out of the winepress up to the horses’ bridles, for a thousand six hundred stadia.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "203"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Here come the bowls!"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 1,
		"text": "And I saw another sign in heaven, great and marvelous: seven angels having the seven last plagues—in them the fury of God is completed.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "204"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The song of the victors"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 2,
		"text": "And I saw as it were a sea of glass mingled with fire, and those who prevailed over the Beast and over his image and over the number of his name, standing on the glassy sea, having harps of God.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "205"
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 3,
		"text": "They sing the song of Moses, the slave of God, and the song of the Lamb, saying: “Great and marvelous are Your works, O Lord God, the Almighty! Just and true are Your ways, O King of the nations!",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "206"
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 4,
		"text": "Who could not fear You, O Lord, and glorify Your name? Because You alone are holy; because all the nations will come and do obeisance before You, because Your righteous judgments have been manifested.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The angels are commissioned"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 5,
		"text": "After these things I looked, and the sanctuary of the tabernacle of the testimony in the heaven was opened.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 6,
		"text": "And out from that heaven",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "207"
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 6,
		"text": "came the seven angels, the ones having the seven plagues; they were clothed in pure bright linen and were girded around the chests with golden belts.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "208"
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 7,
		"text": "Then one of the four living beings gave the seven angels seven golden bowls filled with the fury of God, the One who lives forever and ever.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 15,
		"verseNumber": 8,
		"text": "The sanctuary was filled with smoke from the glory of God and from His power, and no one was able to go into the sanctuary until the seven angels’ plagues were completed. ",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 1,
		"text": "And I heard a loud voice from the sanctuary saying to the seven angels, “Go, pour out the bowls of God’s fury on the earth.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The first bowl"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 2,
		"text": "So off went the first one and poured out his bowl on the earth, and a foul and malignant ulcer",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "209"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 2,
		"text": "appeared in the people who had the mark of the beast and those who worshipped his image.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The second bowl"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 3,
		"text": "Then the second angel poured out his bowl on the sea, and it turned into blood, like a dead person’s; so every living soul in the sea died.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "210"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The third bowl"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 4,
		"text": "Then the third angel poured out his bowl on the rivers and the springs of water, and they turned into blood.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 5,
		"text": "And I heard the angel of the waters saying: “How just You are! The One who is and who was, the holy One, because You have judged these things.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 6,
		"text": "Because they shed the blood of saints and prophets, and You have given them blood to drink.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "211"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 6,
		"text": "They deserve it!”",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 7,
		"text": "And I heard one from the altar saying: “Yes, O Lord God, the Almighty! Your judgings are true and just!”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The fourth bowl"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 8,
		"text": "Then the fourth angel poured out his bowl on the sun, and it was granted to him to burn the people with fire.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 9,
		"text": "So the people were burned with severe burns, and they blasphemed the name of God, who has authority over these plagues. And they did not repent to give Him glory.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "212"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The fifth bowl"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 10,
		"text": "Then the fifth angel poured out his bowl on the throne of the Beast, and his kingdom was plunged into darkness; so they gnawed their tongues because of the pain.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "213"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 11,
		"text": "And they blasphemed the God of heaven because of their pains, and because of their ulcers; yet they did not repent of their deeds.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The sixth bowl"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 12,
		"text": "Then the sixth angel poured out his bowl on the great river Euphrates, and its water was dried up, so that the way for the kings from the sun’s rising might be prepared.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 13,
		"text": "And I saw three unclean spirits, like frogs, coming  out of the mouth of the dragon, out of the mouth of the Beast, and out of the mouth of the false prophet.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 14,
		"text": "For they are spirits of demons, performing signs, which go out to the kings of the whole inhabited earth, to gather them to the battle of that great day of God Almighty.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 15,
		"text": "(“Watch out, I am coming like a thief. Blessed is the one who watches and guards his clothes,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "214"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 15,
		"text": "so that he not walk about naked and they see his shame.”)",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "215"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 16,
		"text": "So he gathered them to the place called in Hebrew, Armagedon.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The seventh bowl"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 17,
		"text": "Then the seventh angel poured out his bowl into the air, and a great voice came out of the sanctuary of heaven, from the Throne, saying, “It is done!”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 18,
		"text": "and there were lightnings and thunders and noises. And there was a tremendous earthquake, a terribly severe earthquake such as had not occurred since mankind existed on the earth.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 19,
		"text": "So the great city was divided into three parts, and the cities of the nations fell.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "216"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 19,
		"text": "And Babylon the great was remembered before God, to give her the cup of the wine of the fury of His wrath.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 20,
		"text": "And every island fled, and mountains were not found.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 21,
		"text": "And huge hailstones, weighing about a talent,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "217"
	},
	{
		"type": "verse",
		"chapterNumber": 16,
		"verseNumber": 21,
		"text": "fell out of the sky on the people; and the people blasphemed God on account of the plague of the hail, because its plague was exceedingly severe.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "About Babylon"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 1,
		"text": "One of the seven angels who had the seven bowls came and spoke with me saying, “Come, I will show you the judgment of the great whore who sits on the many waters,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 2,
		"text": "with whom the kings of the earth fornicated; and the inhabitants of the earth were made drunk with the wine of her fornication.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "A woman and a beast"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 3,
		"text": "So he took me away in spirit to a wilderness. And I saw a woman sitting on a scarlet beast full of blasphemous names, having seven heads and ten horns.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 4,
		"text": "And the woman was clothed in purple and scarlet, adorned with gold and precious stones and pearls, having in her hand a golden cup full of abominations and the filthiness of her fornication.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 5,
		"text": "And on her forehead a name was written: “Mystery, Babylon the Great, the Mother of the prostitutes and the abominations of the earth.”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "218"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 6,
		"text": "And I saw the woman drunk with the blood of the saints, even with the blood of the martyrs of Jesus. And upon seeing her I was tremendously impressed.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The vision explained"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 7,
		"text": "So the angel said to me: “Why are you impressed? I will tell you the mystery of the woman and of the beast, having the seven heads and the ten horns, that carries her.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 8,
		"text": "The beast that you saw was, and is not, and is about to come up out of the Abyss",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "219"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 8,
		"text": "and to go into perdition. And those who dwell upon the earth will be amazed, whose names are not written in the Book of Life from the foundation of the world,",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "220"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 8,
		"text": "when they see the beast that was, and is not and will be present.",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 9,
		"text": "Here is the mind that has wisdom: The seven heads are seven mountains on which the woman sits.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 10,
		"text": "And there are seven kings; five have fallen, one is, the other has not come yet. And whenever he comes he must continue a short time.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 11,
		"text": "And the beast that was and is not; he is actually the eighth, yet he is of the seven, and he is going into perdition.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 12,
		"text": "And the ten horns that you saw are ten kings who have not yet received a kingdom, but they receive authority as kings with the Beast for one hour.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 13,
		"text": "These are of one mind and give their power and authority to the Beast.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 14,
		"text": "They will make war with the Lamb, and the Lamb will conquer them, because He is Lord of lords and King of kings; and those who are with Him are called and chosen and faithful.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 15,
		"text": "Then he says to me: “The waters that you saw, where the whore sits, are peoples and multitudes and nations and languages.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 16,
		"text": "And the ten horns that you saw, also the beast, these will hate the whore and will lay her waste and strip her and eat her flesh and burn her with fire.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 17,
		"text": "Because God put it into their hearts to perform His purpose, even to be of one mind, and to give their kingdom to the Beast, until the words of God should be fulfilled.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "221"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 18,
		"text": "Now the woman whom you saw is the great city",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "222"
	},
	{
		"type": "verse",
		"chapterNumber": 17,
		"verseNumber": 18,
		"text": "that holds rulership over the kings of the earth.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Her fall proclaimed"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 1,
		"text": "After these things I saw another angel coming down from heaven, having great authority, and the earth was illuminated by his splendor.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 2,
		"text": "And he cried out with a strong voice saying: “It fell, it fell, Babylon the great! and has become a dwelling place of demons, even a prison of every unclean spirit, also a prison of every unclean and detestable bird.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 3,
		"text": "Because all the nations have drunk of the rage of the wine of her fornication, and the kings of the earth have fornicated with her, and the merchants of the earth became rich through the strength of her luxury.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 4,
		"text": "And I heard another Voice from heaven saying: “Come out of her, my people,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "223"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 4,
		"text": "so as not to participate in her sins and so as not to receive of her plagues.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 5,
		"text": "For her sins have reached to heaven and God has remembered about her her iniquities.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "224"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 6,
		"text": "Render to her just as she rendered to you;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "225"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 6,
		"text": "yes, pay her back double, according to her deeds; in the cup that she mixed, mix double for her.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 7,
		"text": "To the extent that she glorified herself and lived luxuriously, by so much give her torment; because in her heart she says, ‘I sit a queen, and am not a widow; and I will certainly not see sorrow’.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 8,
		"text": "Therefore her plagues will come in one day— death and sorrow and famine—and she will be burned up with fire; because the Lord God who has judged her is  strong .",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Her fall lamented"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 9,
		"text": "“The kings of the earth who fornicated and lived luxuriously with her will weep and mourn over her, when they see the smoke of her burning,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 10,
		"text": "standing afar off for fear of her torment,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "226"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 10,
		"text": "saying: ‘Alas, alas, O great city Babylon, O mighty city! Because your judgment came in one hour.’",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 11,
		"text": "“And the merchants of the earth weep and sorrow over her, because no one buys their goods anymore:",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 12,
		"text": "goods of gold and of silver, of precious stones and of pearl, of fine linen and of purple, of silk and of scarlet; every citron wood and object of ivory, every object of most precious wood and of bronze and of iron and of marble;",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 13,
		"text": "cinnamon and incense and perfume and frankincense, wine and olive oil and fine flour and wheat, cattle and sheep and horses and carriages, and bodies and souls of men!”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 14,
		"text": "(‘Yes, the fruit that your soul craved has gone from you, and all the sumptuous and splendid things have perished from you, and you will never find them again!’)",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "227"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 15,
		"text": "“The merchants of these things, who became rich by her, will stand afar off for fear of her torment,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "228"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 15,
		"text": "weeping and sorrowing",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 16,
		"text": "and saying: ‘Alas, alas, O great city! that was clothed in fine linen and purple and scarlet, and was adorned with gold and precious stones and pearls;",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 17,
		"text": "because in one hour such great wealth was laid waste.’",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 17,
		"text": "“And every ship captain, and all who travel by ship—sailors and as many as work the sea—stood afar off",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 18,
		"text": "and cried out, seeing the smoke of her burning, saying, ‘Who is like the great city!?’",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 19,
		"text": "They threw dust on their heads and cried out, weeping and sorrowing and saying: ‘Alas, alas, O great city! by which all who had ships in the sea became rich, by her costly abundance; because in one hour she was laid waste.’",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Her doom final"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 20,
		"text": "“Rejoice over her, O heaven, yes you saints and apostles and prophets, because God has pronounced your judgment against her!”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "229"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 21,
		"text": "And a mighty angel took up a stone like a huge millstone and threw it into the ocean saying: “The great city Babylon will be thrown down violently, and will never be found again.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 22,
		"text": "The sound of harpists and musicians and flutists and trumpeters will never be heard in you again; no craftsman of whatever craft will ever be found in you again; the sound of a millstone will never be heard in you again;",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 23,
		"text": "the light of a lamp will never shine in you again; the voice of bridegroom and bride will never be heard in you again; because your merchants were the magnates of the earth, because by your sorcery",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "230"
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 23,
		"text": "all the nations were deceived.”",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 18,
		"verseNumber": 24,
		"text": "And in her was found the blood of prophets and saints, even of all who had been butchered on the earth.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Her fall celebrated"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 1,
		"text": "After these things I heard as it were the really loud voice of a great multitude in heaven saying: “Hallelujah! The salvation and power and glory of our God!",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 2,
		"text": "Because His judgments are true and just, because He has judged the great whore who corrupted the earth with her fornication, and has avenged the blood of His slaves by her hand.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 3,
		"text": "And a second voice said, “Hallelujah! Her smoke goes up for ever and ever!”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "231"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 4,
		"text": "And the twenty-four elders and the four living beings fell down and worshipped God, who sits on the throne, saying, “Amen, Hallelujah!”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 5,
		"text": "And a voice came from the Throne saying, “Praise our God, all you His slaves and those who fear Him, small and great!”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The wedding of the Lamb"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 6,
		"text": "And I heard as it were the voice of a great multitude like the sound of many waters and like the sound of mighty thunderings saying: “Hallelujah! Because the Lord our God reigns, the Almighty!",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 7,
		"text": "Let us rejoice and exult and give Him the glory, because the wedding of the Lamb has come, and His wife has prepared herself.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 8,
		"text": "And it was granted to her to be dressed in fine linen, bright and pure, for the fine linen is the righteous deeds of the saints.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 9,
		"text": "And he says to me,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "232"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 9,
		"text": "“Write: ‘Blessed are those who are invited to the wedding banquet of the Lamb’.” And he says to me, “These are the true words of God”.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 10,
		"text": "And I fell at his feet to worship him, but he says to me: “Don’t! I am your fellow slave and among your brothers who hold the testimony of Jesus.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "233"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 10,
		"text": "Worship God! For the testimony of Jesus is the spirit of prophecy.”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "234"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The battle of Armageddon"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 11,
		"text": "I saw the heaven opened, and wow, a white horse! And the One who sits on it, called Faithful and True, both judges and makes war with righteousness.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 12,
		"text": "Now His eyes were a flame of fire and on His head were many diadems, having names written,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "235"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 12,
		"text": "besides a written name that no one knows except Himself;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 13,
		"text": "and He was clothed with a robe that had been dipped in blood, and His name is called The Word of God.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 14,
		"text": "And the armies in heaven, clothed in fine linen, white, clean, followed Him on white horses.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 15,
		"text": "And out of His mouth goes a sharp, two-edged sword, so that with it He may strike the nations. And He Himself will shepherd them with a rod of iron. And He Himself treads the winepress of the fury of the wrath of God, the Almighty.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "236"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 16,
		"text": "And He has a name written on His robe and on His thigh, King of kings and Lord of lords!",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "A feast for vultures"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 17,
		"text": "And I saw an angel standing in the sun; and he cried out with a loud voice, saying to all the birds that fly in mid-heaven,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "237"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 17,
		"text": "“Come, gather together to the great dinner of God,",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 18,
		"text": "so that you may eat flesh of kings and flesh of commanders and flesh of the mighty and flesh of horses along with their riders, even the flesh of all, both free and slave, both small and great.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 19,
		"text": "And I saw the Beast and the kings of the earth and their armies gathered together to make war against the One riding the horse and against His army.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 20,
		"text": "So the Beast was captured, and with him the False prophet, the one who performed signs in his presence (by which he had deceived those who had received the mark of the Beast and those who worshipped his image). The two were thrown alive into the Lake of Fire that burns with brimstone.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "238"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 21,
		"text": "And the rest were killed by the sword that proceeds from the mouth of the One riding the horse.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "239"
	},
	{
		"type": "verse",
		"chapterNumber": 19,
		"verseNumber": 21,
		"text": "And all the birds were filled with their flesh.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "240"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The Millennium"
	},
	{
		"type": "header",
		"text": "Satan bound"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 1,
		"text": "And I saw an angel coming down from heaven, having the key of the Abyss and a huge chain on his hand.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 2,
		"text": "And he seized the dragon, the ancient serpent, who is a slanderer, even Satan, who deceives the whole inhabited earth,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "241"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 2,
		"text": "and bound him for a thousand years;",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 3,
		"text": "he threw him into the Abyss and locked and sealed it  over him so that he should not deceive the nations any more until the thousand years were finished. And after these  years he must be loosed for a short time.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "242"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Saints reign"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 4,
		"text": "And I saw thrones, and they sat on them, and judgment was committed to them; also,  I saw  the souls of those who had been beheaded",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "243"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 4,
		"text": "on account of the testimony of Jesus and on account of the Word of God, even those who had not worshipped the Beast or his image and had not received the mark on their forehead and on their hand. And they lived and reigned with the Christ for a thousand years.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 5,
		"text": "(Now the rest of the dead did not come to life until the thousand years were finished.)",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "244"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 5,
		"text": "This is the first resurrection.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 6,
		"text": "Blessed and holy is the one having a part in the first resurrection; upon such the second death has no power, but they will be priests of God and of Christ, and will reign with Him a thousand years.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The final rebellion"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 7,
		"text": "Now when the thousand years are finished Satan will be released from his prison,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 8,
		"text": "and he will go forth to deceive the nations that are in the four corners of the earth, Gog and Magog, to gather them together to the war, whose number is like the sand of the sea.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "245"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 9,
		"text": "They went up on the breadth of the earth and surrounded the camp of the saints and the beloved city. And fire came down out of heaven from God and devoured them.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "246"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 10,
		"text": "And the devil, who deceived them, was thrown into the Lake of Fire and brimstone, where the Beast and the False prophet also are. And they will be tormented day and night forever and ever.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The Great White Throne"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 11,
		"text": "Then I saw a tremendous white throne and the One who sat on it, from whose face the earth and the sky fled away;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "247"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 11,
		"text": "and no place was found for them.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 12,
		"text": "And I saw the dead, great and small, standing before the throne;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "248"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 12,
		"text": "and books were opened. And another Book was opened, namely, of Life. And the dead were judged according to their works, by the things that were written in the books.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 13,
		"text": "The ocean gave up the dead who were in it, and Death and Hades gave up the dead who were in them;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "249"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 13,
		"text": "and they were judged each one according to their works.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "250"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 14,
		"text": "And Death and Hades were thrown into the Lake of Fire. This is the second death, the Lake of Fire.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "251"
	},
	{
		"type": "verse",
		"chapterNumber": 20,
		"verseNumber": 15,
		"text": "And if anyone was not found written in the Book of Life he was thrown into the Lake of Fire.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "252"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "New heaven, new earth"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 1,
		"text": "Now I saw a new heaven and a new earth, because the first heaven and the first earth had passed away;",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "253"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 1,
		"text": "also, the ocean was no more.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "254"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 2,
		"text": "And I saw the holy city, New Jerusalem, coming down out of heaven from God, prepared like a bride adorned for her husband.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 3,
		"text": "And I heard a loud voice from heaven saying: “Take note, the tabernacle of God is with men and He will dwell with them, and they will be His people. Yes, God Himself will be with them.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 4,
		"text": "And He will wipe away every tear from their eyes; there will be no more death nor sorrow nor crying nor pain",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "255"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 4,
		"text": "—they will exist no more because the first things have gone.”",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 5,
		"text": "Then He who sat on the throne",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "256"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 5,
		"text": "said, “Take note, I make everything new!” And He says to me, “Write, because these words are true and faithful!”",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "257"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 6,
		"text": "Then He said to me: “I have become the Alpha and the Omega, the Beginning and the End.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "258"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 6,
		"text": "To the one who thirsts I will give of the spring of the water of Life freely.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 7,
		"text": "He who overcomes will inherit these things, and I will be God to him and he will be a son to me.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 8,
		"text": "But as for the cowardly",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "259"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 8,
		"text": "and unbelieving and sinners",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "260"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 8,
		"text": "and abominable and murderers and fornicators and sorcerers and idolaters, and all who are false,",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "261"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 8,
		"text": "their portion is in the Lake that burns with fire and brimstone, which is the second death.”",
		"sectionNumber": 4
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "The New Jerusalem"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 9,
		"text": "Then",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "262"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 9,
		"text": "one of the seven angels who had the seven bowls full of the seven last plagues came and spoke with me saying, “Come, I will show you the woman, the Lamb’s bride”.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "263"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 10,
		"text": "So he transported me in spirit to a great and high mountain and showed me the great city, the holy Jerusalem, coming down out of heaven from God,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 11,
		"text": "having the splendor of God. Her radiance was similar to a most precious stone, like a crystalline jasper stone;",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 12,
		"text": "she had a tremendous, high wall with twelve gates, and at the gates twelve angels, and names inscribed, namely the twelve tribes of the sons of Israel;",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 13,
		"text": "looking  from the east, three gates, and from the north, three gates, and from the south, three gates, and from the west, three gates.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 14,
		"text": "And the wall of the city had twelve foundations, and on them twelve names, of the twelve apostles of the Lamb.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "264"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 15,
		"text": "Now he who spoke with me had a measure, a golden reed, so that he might measure the city and her gates.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "265"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 16,
		"text": "The city is laid out as a square; that is, her length is equal to her width. So he measured the city with the reed at twelve thousand and twelve stadia.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "266"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 16,
		"text": "Her length and width and height are equal.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "267"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 17,
		"text": "And he measured her wall, one hundred and forty-four cubits,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "268"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 17,
		"text": "the measure of a man (which is of an angel).",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "269"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 18,
		"text": "The material of her wall was jasper,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "270"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 18,
		"text": "and the city was pure gold, like clear glass.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 19,
		"text": "And the foundations of the wall of the city were adorned with all kinds of precious stones: the first foundation  had  jasper, the second sapphire, the third chalcedony, the fourth emerald,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 20,
		"text": "the fifth sardonyx, the sixth carnelian, the seventh chrysolite, the eighth beryl, the ninth topaz, the tenth chrysoprase, the eleventh jacinth, the twelfth amethyst.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "271"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 21,
		"text": "And the twelve gates are twelve pearls; each individual gate was  composed  of one pearl.",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "272"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 21,
		"text": "And the street of the city was pure gold, like transparent glass.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "273"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Her glory"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 22,
		"text": "I saw no sanctuary in her, because the Lord God, the Almighty, and the Lamb are her sanctuary.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 23,
		"text": "And the city has no need of the sun or the moon, that they should shine on her, because the very glory of God illumines her, and the Lamb is her light.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 24,
		"text": "And the nations will walk in her light, and the kings of the earth",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "274"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 24,
		"text": "bring their glory and honor into her.",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 25,
		"text": "Her gates will absolutely not be closed by day (and no night will exist there).",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 26,
		"text": "And they will bring the glory and the honor of the nations into her.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 27,
		"text": "But anything ‘common’",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "275"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 27,
		"text": "or anyone perpetrating an abomination or a lie will absolutely not enter her;",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "276"
	},
	{
		"type": "verse",
		"chapterNumber": 21,
		"verseNumber": 27,
		"text": "only those who are written in the Lamb’s Book of Life.",
		"sectionNumber": 3
	},
	{
		"type": "note reference",
		"identifier": "277"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Her river"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 1,
		"text": "And he showed me a pure river of water of life,",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "278"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 1,
		"text": "bright as crystal, proceeding from the throne of God and of the Lamb,",
		"sectionNumber": 2
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 2,
		"text": "in the middle of her street. And on either side of the river was a tree of life producing twelve fruits, yielding each month’s fruit monthly; and the leaves of the tree are for the healing of the nations.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 3,
		"text": "There will be no accursed thing there, but the throne of God and of the Lamb are in her, and His slaves will minister to Him.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 4,
		"text": "They will see His face and His name is on their foreheads.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 5,
		"text": "Night will not exist there and they will need neither lamp nor sunlight, because the Lord God illuminates them. And they will reign forever and ever.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Conclusion"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 6,
		"text": "Then He says to me: “These words are faithful and true. The Lord God of the spirits",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "279"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 6,
		"text": "of the prophets sent His angel to show to His slaves the things that must shortly take place.",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "280"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 7,
		"text": "Take note, I am coming swiftly! Blessed is the one who keeps the words of the prophecy of this book.”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "281"
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 8,
		"text": "Now I, John, who heard and saw these things, when I had heard and seen I fell down to worship at the feet of the angel who showed me these things,",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 9,
		"text": "but he says to me: “Don’t! I am your fellow slave and of your brothers the prophets, those who keep the words of this book. Worship God!”",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "282"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 10,
		"text": "Then he says to me: “Do not seal the words of the prophecy of this book, for the time is near.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 11,
		"text": "He who acts unjustly let him act unjustly still, and let the filthy one be filthy still, and let the righteous one still practice righteousness, and let the holy one still be sanctified.”",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "Jesus’ final word"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 12,
		"text": "“Take note, I am coming swiftly, and my reward is with me to give to each one according to his work.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 13,
		"text": "I am the Alpha and the Omega, beginning and end, the First and the Last.”",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 14,
		"text": "(Blessed are those who do His commands, so that they may have the right to the tree of life, even to enter through the gates into the city.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 15,
		"text": "Outside are the ‘dogs’",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "283"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 15,
		"text": "and the sorcerers and the fornicators and the murderers and the idolaters,",
		"sectionNumber": 2
	},
	{
		"type": "note reference",
		"identifier": "284"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 15,
		"text": "and everyone who loves and practices a lie.)",
		"sectionNumber": 3
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 16,
		"text": "“I, Jesus, have sent my angel to testify these things to you, in the churches. I am the Root and the Offspring of David, the bright morning Star.",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 17,
		"text": "Both the Spirit and the Bride say, ‘Come!’ And let whoever hears say, ‘Come!’ And let whoever thirsts come; whoever wants to, let him take the water of life free of charge.",
		"sectionNumber": 1
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "A serious warning"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 18,
		"text": "“I myself testify to everyone who hears the words of the prophecy of this book: If any one adds to them, may God add to him the seven plagues written in this book!",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "285"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 19,
		"text": "And if anyone takes away from the word s",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "286"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 19,
		"text": "of the book of this prophecy, may God remove his share from the tree of life and out of the Holy City, that stand written in this book!”",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	},
	{
		"type": "header",
		"text": "John signs off"
	},
	{
		"type": "start paragraph"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 20,
		"text": "He who testifies to these things says, “Yes, I am coming swiftly!” Oh yes!! Come, Sovereign Jesus!",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 21,
		"text": "The grace of the Lord Jesus Christ",
		"sectionNumber": 1
	},
	{
		"type": "note reference",
		"identifier": "287"
	},
	{
		"type": "verse",
		"chapterNumber": 22,
		"verseNumber": 21,
		"text": "be with all the saints. Amen.",
		"sectionNumber": 2
	},
	{
		"type": "end paragraph"
	}
]
},{}],10:[function(require,module,exports){

;(function (name, root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory()
  }
  /* istanbul ignore next */
  else if (typeof define === 'function' && define.amd) {
    define(factory)
  }
  else {
    root[name] = factory()
  }
}('slugify', this, function () {
  var charMap = {
    // latin
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
    'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
    'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
    'Õ': 'O', 'Ö': 'O', 'Ő': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U',
    'Ü': 'U', 'Ű': 'U', 'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss', 'à': 'a', 'á': 'a',
    'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e',
    'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ő': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ű': 'u',
    'ý': 'y', 'þ': 'th', 'ÿ': 'y', 'ẞ': 'SS',
    // greek
    'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': '8',
    'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': '3', 'ο': 'o', 'π': 'p',
    'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'x', 'ψ': 'ps', 'ω': 'w',
    'ά': 'a', 'έ': 'e', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ή': 'h', 'ώ': 'w', 'ς': 's',
    'ϊ': 'i', 'ΰ': 'y', 'ϋ': 'y', 'ΐ': 'i',
    'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': '8',
    'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': '3', 'Ο': 'O', 'Π': 'P',
    'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'X', 'Ψ': 'PS', 'Ω': 'W',
    'Ά': 'A', 'Έ': 'E', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'Y', 'Ή': 'H', 'Ώ': 'W', 'Ϊ': 'I',
    'Ϋ': 'Y',
    // turkish
    'ş': 's', 'Ş': 'S', 'ı': 'i', 'İ': 'I', 'ç': 'c', 'Ç': 'C', 'ü': 'u', 'Ü': 'U',
    'ö': 'o', 'Ö': 'O', 'ğ': 'g', 'Ğ': 'G',
    // russian
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': 'u', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': 'U', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
    'Я': 'Ya',
    // ukranian
    'Є': 'Ye', 'І': 'I', 'Ї': 'Yi', 'Ґ': 'G', 'є': 'ye', 'і': 'i', 'ї': 'yi', 'ґ': 'g',
    // czech
    'č': 'c', 'ď': 'd', 'ě': 'e', 'ň': 'n', 'ř': 'r', 'š': 's', 'ť': 't', 'ů': 'u',
    'ž': 'z', 'Č': 'C', 'Ď': 'D', 'Ě': 'E', 'Ň': 'N', 'Ř': 'R', 'Š': 'S', 'Ť': 'T',
    'Ů': 'U', 'Ž': 'Z',
    // polish
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z',
    'ż': 'z', 'Ą': 'A', 'Ć': 'C', 'Ę': 'e', 'Ł': 'L', 'Ń': 'N', 'Ś': 'S',
    'Ź': 'Z', 'Ż': 'Z',
    // latvian
    'ā': 'a', 'č': 'c', 'ē': 'e', 'ģ': 'g', 'ī': 'i', 'ķ': 'k', 'ļ': 'l', 'ņ': 'n',
    'š': 's', 'ū': 'u', 'ž': 'z', 'Ā': 'A', 'Č': 'C', 'Ē': 'E', 'Ģ': 'G', 'Ī': 'i',
    'Ķ': 'k', 'Ļ': 'L', 'Ņ': 'N', 'Š': 'S', 'Ū': 'u', 'Ž': 'Z',
    // currency
    '€': 'euro', '₢': 'cruzeiro', '₣': 'french franc', '£': 'pound',
    '₤': 'lira', '₥': 'mill', '₦': 'naira', '₧': 'peseta', '₨': 'rupee',
    '₩': 'won', '₪': 'new shequel', '₫': 'dong', '₭': 'kip', '₮': 'tugrik',
    '₯': 'drachma', '₰': 'penny', '₱': 'peso', '₲': 'guarani', '₳': 'austral',
    '₴': 'hryvnia', '₵': 'cedi', '¢': 'cent', '¥': 'yen', '元': 'yuan',
    '円': 'yen', '﷼': 'rial', '₠': 'ecu', '¤': 'currency', '฿': 'baht',
    '$': 'dollar',
    // symbols
    '©': '(c)', 'œ': 'oe', 'Œ': 'OE', '∑': 'sum', '®': '(r)', '†': '+',
    '“': '"', '”': '"', '‘': "'", '’': "'", '∂': 'd', 'ƒ': 'f', '™': 'tm',
    '℠': 'sm', '…': '...', '˚': 'o', 'º': 'o', 'ª': 'a', '•': '*',
    '∆': 'delta', '∞': 'infinity', '♥': 'love', '&': 'and', '|': 'or',
    '<': 'less', '>': 'greater'
  }

  function replace (string, replacement) {
    return string.split('').reduce(function (result, ch) {
      if (charMap[ch]) {
        ch = charMap[ch]
      }
      // allowed
      ch = ch.replace(/[^\w\s$*_+~.()'"!\-:@]/g, '')
      result += ch
      return result
    }, '')
      // trim leading/trailing spaces
      .replace(/^\s+|\s+$/g, '')
      // convert spaces
      .replace(/[-\s]+/g, replacement || '-')
      // remove trailing separator
      .replace('#{replacement}$', '')
  }

  replace.extend = function (customMap) {
    for (var key in customMap) {
      charMap[key] = customMap[key]
    }
  }

  return replace
}))

},{}],11:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var identifiers = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
var VERSE_SECTION_RANGE_MIN = 1;
var VERSE_SECTION_RANGE_MAX = 9999;

module.exports = [{
	identifier: 'A',
	title: 'Prologue',
	description: 'How to Read This Book',
	range: r([1, 1], [1, 11])
}, {
	identifier: 'B',
	title: 'First Septet – Seven Churches',
	description: 'A Look at the Beginnings of the Church that Christ is Building',
	range: r([2, 1], [3, 22]),
	introduction: {
		title: 'Introduction to the seven churches – Christ is present with His church',
		range: r([1, 12], [1, 20])
	},
	subsections: makeSubsections(s('Ephesus', r([2, 1], [2, 7])), s('Smyrna', r([2, 8], [2, 11])), s('Pergamos', r([2, 12], [2, 17])), s('Thyatira', r([2, 18], [2, 29])), s('Sardis', r([3, 1], [3, 6])), s('Philadelphia', r([3, 7], [3, 13])), s('Laodicea', r([3, 14], [3, 22])))
}, {
	identifier: 'C',
	title: 'Second Septet – Seven Seals',
	description: 'Legal Judgments to be Executed Against Church’s Persecutors',
	range: r([6, 1], [8, 1]),
	introduction: {
		title: 'Introduction to the seven seals – Christ is on His throne and is governing all of history',
		range: r([4, 1], [5, 14])
	},
	subsections: [s('Seal 1 - the white horse', r([6, 1], [6, 2]), 'a'), s('Seal 2 - the red horse', r([6, 3], [6, 4]), 'b'), s('Seal 3 - the black horse', r([6, 5], [6, 6]), 'c'), s('Seal 4 - the yellowish-green horse', r([6, 7], [6, 8]), 'd'), s('Seal 5 - the souls under the altar', r([6, 9], [6, 11]), 'e'), s('Seal 6 - the earthquake', r([6, 12], [6, 17]), 'f'), s('Interlude before the 7th seal: the 144,000 of the Jewish remnant and the innumerable multitude', r([7, 1], [7, 17])), s('Seal 7 - introduces the seven trumpets and seems to comprise all of the third septet', r([8, 1], [8, 1]), 'g')]
}, {
	identifier: 'D',
	title: 'Third Septet – Seven Trumpets',
	description: 'The War Against the Church’s Persecutors',
	range: r([8, 7], [11, 19]),
	introduction: {
		title: 'Introduction to the seven trumpets – God ordains victory for the church through prayer',
		range: r([8, 2], [8, 6])
	},
	subsections: [s('Trumpet 1 - The land is set on fire', r([8, 7], [8, 7]), 'a'), s('Trumpet 2 - The sea is turned to blood', r([8, 8], [8, 9]), 'b'), s('Trumpet 3 - The rivers and springs become bitter', r([8, 10], [8, 12]), 'c'), s('Trumpet 4 - The heavenly bodies are dimmed', r([8, 12], [8, 13]), 'd'), s('Trumpet 5 - Demons released from the pit', r([9, 1], [9, 12]), 'e'), s('Trumpet 6 - Demons released from Euphrates', r([9, 13], [9, 21]), 'f'), s('Interlude before 7th trumpet: The closing off of prophecy & the nature of prophecy', r([10, 1], [11, 14])), s('Trumpet 7 - The seventh trumpet seems to comprise all of the fourth septet', r([11, 15], [11, 19]), 'g')]
}, {
	identifier: 'E',
	title: 'Fourth Septet – Seven Visions',
	description: 'From Total Defeat to Victory',
	range: r([13, 1], [15, 1]),
	introduction: {
		title: 'Introduction to the seven visions – The invisible battles are the key to the earthly ones',
		range: r([12, 1], [12, 17]),
		subsections: [s('The Bride reflecting the glory of her husband', r([12, 1], [12, 1]), 'Ea'), s('The Child of the woman', r([12, 2], [12, 2]), 'Eb'), s('The Dragon tries to devour the Child', r([12, 3], [12, 5]), 'Ec'), s('The woman flees to the wilderness', r([12, 6], [12, 6]), 'Ed'), s('Dragon war in heaven', r([12, 7], [12, 9]), 'Ee'), s('Victory of Christ & His people over the dragon', r([12, 10], [12, 11]), 'Ef'), s('Dragon war on earth', r([12, 12], [12, 13]), 'Ee'), s('The woman flees to the wilderness', r([12, 14], [12, 14]), 'Ed'), s('The Dragon\'s mouth & the earth swallows the serpents flood', r([12, 15], [12, 16]), 'Ec'), s('The rest of the offspring of the woman', r([12, 17, 1], [12, 17, 1]), 'Eb'), s('The church reflecting the word of Christ', r([12, 17, 2], [12, 17]), 'Ea')]
	},
	subsections: [s('The beast rising out of the sea', r([13, 1], [13, 10])), s('The beast rising out of the land', r([13, 11], [13, 18])), s('The 144,000 virgin (warriors) and the Lamb', r([14, 1], [14, 5])), s('The seven angels', r([14, 6], [14, 13])), s('The positive reaping of wheat', r([14, 14], [14, 16])), s('The negative reaping of grapes', r([14, 17], [14, 20])), s('The final "sign in heaven" seems to comprise everything in the fifth septet and guarantees the eventual conversion of all nations (15:1-4)', r([15, 1], [15, 1]))]
}, {
	identifier: 'D',
	title: 'Fifth Septet – Seven Bowls of Wrath Containing the Seven Plagues',
	range: r([16, 2], [16, 17]),
	introduction: {
		title: 'Introduction to the seven plagues – angels preparing for warfare; temple filled with God’s glory',
		range: r([15, 2], [16, 1])
	},
	subsections: makeSubsections(s('Bowl 1 - On the land', r([16, 2], [16, 2])), s('Bowl 2 - On the sea', r([16, 3], [16, 3])), s('Bowl 3 - On the waters', r([16, 4], [16, 7])), s('Bowl 4 - On the sun', r([16, 8], [16, 9])), s('Bowl 5 - On the throne of the beast', r([16, 10], [16, 11])), s('Bowl 6 - On the Euphrates', r([16, 12], [16, 16])), s('Bowl 7 - On the air – note that this 7th bowl seems to introduce all of the next septet (cf. 16:17-21)', r([16, 17], [16, 17])))
}, {
	identifier: 'C',
	title: 'Sixth Septet – Seven Condemnations of Babylon',
	range: r([17, 1], [19, 10]),
	introduction: {
		title: 'Introduction to the seven condemnations – Even with Roman support, Jerusalem is no match for Christ',
		range: r([16, 17], [16, 21])
	},
	subsections: makeSubsections(s('Blasphemy of the Harlot', r([17, 1], [17, 6])), s('Harlots Pagan Alliance with Rome', r([17, 7], [17, 18])), s('Spiritual fornications', r([18, 1], [18, 8])), s('Ungodly statist/commercial alliance', r([18, 9], [18, 20])), s('The finality of Babylon’s fall', r([18, 21], [18, 24])), s('All heaven agreeing with her judgment', r([19, 1], [19, 4])), s('The death of the harlot is followed by the marriage of the Lamb', r([19, 5], [19, 10])))
}, {
	identifier: 'B',
	title: 'Seventh Septet – Seven visions of the victory of Christ’s Kingdom – The Church Militant & Triumphant',
	range: r([20, 1], [22, 17]),
	introduction: {
		title: 'Introduction to the seven New Covenant visions – Jesus proves that He is King of kings and Lord of lords',
		range: r([19, 11], [19, 21])
	},
	subsections: makeSubsections(s('Satan’s power bound', r([20, 1], [20, 3])), s('Victory over death guaranteed – reign in life and in death', r([20, 4], [20, 6])), s('Final judgment', r([20, 7], [20, 15])), s('All things made new', r([21, 1], [21, 8])), s('The New Jerusalem as the spotless bride', r([21, 9], [21, 27])), s('The river of life', r([22, 1], [22, 5])), s('Reiteration that Christ will come soon to finish the old and to continue the renewal of all things', r([22, 6], [22, 17])))
}, {
	identifier: 'A',
	title: 'Epilogue: How to Read This Book',
	range: r([22, 18], [22, 21])
}];

function makeSubsections() {
	for (var _len = arguments.length, subsections = Array(_len), _key = 0; _key < _len; _key++) {
		subsections[_key] = arguments[_key];
	}

	return subsections.map(function (_ref, i) {
		var title = _ref.title,
		    range = _ref.range;

		var identifier = identifiers[i];
		return {
			title: title,
			range: range,
			identifier: identifier
		};
	});
}

function s(title, range, identifier) {
	return { title: title, range: range, identifier: identifier };
}

function r(rangeStart, randeEnd) {
	return [guaranteeRangeSection(rangeStart, VERSE_SECTION_RANGE_MIN), guaranteeRangeSection(randeEnd, VERSE_SECTION_RANGE_MAX)];
}

function guaranteeRangeSection(range, defaultSection) {
	if (range.length === 3) {
		return range;
	} else {
		return [].concat(_toConsumableArray(range), [defaultSection]);
	}
}

},{}],12:[function(require,module,exports){
'use strict';

function applyComputations ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'verses' in newState && typeof state.verses === 'object' || state.verses !== oldState.verses ) ) {
		state.paragraphs = newState.paragraphs = template.computed.paragraphs( state.verses );
	}
}

var template = (function () {

function splitIntoParagraphs(chunks) {
	const paragraphs = []
	let currentParagraph = []

	function finishParagraph() {
		if (currentParagraph.length > 0) {
			paragraphs.push(currentParagraph)
			currentParagraph = []
		}
	}

	chunks.forEach(chunk => {
		if (chunk.type === 'paragraph break') {
			finishParagraph()
		} else {
			currentParagraph.push(chunk)
		}
	})

	finishParagraph()

	return paragraphs
}

return {
	data() {
		return {
			verses: []
		}
	},
	computed: {
		paragraphs(verses) {
			return splitIntoParagraphs(verses)
		}
	}
}
}());

function renderMainFragment ( root, component ) {
	var eachBlock_anchor = createComment();
	var eachBlock_value = root.paragraphs;
	var eachBlock_iterations = [];
	
	for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
		eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
	}

	return {
		mount: function ( target, anchor ) {
			insertNode( eachBlock_anchor, target, anchor );
			
			for ( var i = 0; i < eachBlock_iterations.length; i += 1 ) {
				eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
			}
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			var eachBlock_value = root.paragraphs;
			
			for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
				if ( !eachBlock_iterations[i] ) {
					eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
					eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
				} else {
					eachBlock_iterations[i].update( changed, root, eachBlock_value, eachBlock_value[i], i );
				}
			}
			
			teardownEach( eachBlock_iterations, true, eachBlock_value.length );
			
			eachBlock_iterations.length = eachBlock_value.length;
		},
		
		teardown: function ( detach ) {
			teardownEach( eachBlock_iterations, detach );
			
			if ( detach ) {
				detachNode( eachBlock_anchor );
			}
		}
	};
}

function renderEachBlock ( root, eachBlock_value, paragraph, paragraph__index, component ) {
	var p = createElement( 'p' );
	var last_p_style = root.color ? 'color: ' + root.color : '';
	p.style.cssText = last_p_style;
	
	var eachBlock1_anchor = createComment();
	appendNode( eachBlock1_anchor, p );
	var eachBlock1_value = paragraph;
	var eachBlock1_iterations = [];
	
	for ( var i = 0; i < eachBlock1_value.length; i += 1 ) {
		eachBlock1_iterations[i] = renderEachBlock1( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, eachBlock1_value[i], i, component );
		eachBlock1_iterations[i].mount( eachBlock1_anchor.parentNode, eachBlock1_anchor );
	}

	return {
		mount: function ( target, anchor ) {
			insertNode( p, target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, paragraph, paragraph__index ) {
			var __tmp;
		
			if ( ( __tmp = root.color ? 'color: ' + root.color : '' ) !== last_p_style ) {
				last_p_style = __tmp;
				p.style.cssText = last_p_style;
			}
			
			var eachBlock1_value = paragraph;
			
			for ( var i = 0; i < eachBlock1_value.length; i += 1 ) {
				if ( !eachBlock1_iterations[i] ) {
					eachBlock1_iterations[i] = renderEachBlock1( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, eachBlock1_value[i], i, component );
					eachBlock1_iterations[i].mount( eachBlock1_anchor.parentNode, eachBlock1_anchor );
				} else {
					eachBlock1_iterations[i].update( changed, root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, eachBlock1_value[i], i );
				}
			}
			
			teardownEach( eachBlock1_iterations, true, eachBlock1_value.length );
			
			eachBlock1_iterations.length = eachBlock1_value.length;
		},
		
		teardown: function ( detach ) {
			teardownEach( eachBlock1_iterations, false );
			
			if ( detach ) {
				detachNode( p );
			}
		}
	};
}

function renderEachBlock1 ( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index, component ) {
	var ifBlock_anchor = createComment();
	
	function getBlock ( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index ) {
		if ( chunk.type === 'verse' ) return renderIfBlock_0;
		return null;
	}
	
	var currentBlock = getBlock( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index );
	var ifBlock = currentBlock && currentBlock( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index, component );

	return {
		mount: function ( target, anchor ) {
			insertNode( ifBlock_anchor, target, anchor );
			if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );
		},
		
		update: function ( changed, root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index ) {
			var __tmp;
		
			var _currentBlock = currentBlock;
			currentBlock = getBlock( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index );
			if ( _currentBlock === currentBlock && ifBlock) {
				ifBlock.update( changed, root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index );
			} else {
				if ( ifBlock ) ifBlock.teardown( true );
				ifBlock = currentBlock && currentBlock( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index, component );
				if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );
			}
		},
		
		teardown: function ( detach ) {
			if ( ifBlock ) ifBlock.teardown( detach );
			
			if ( detach ) {
				detachNode( ifBlock_anchor );
			}
		}
	};
}

function renderIfBlock_0 ( root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index, component ) {
	var span = createElement( 'span' );
	var last_span_data_chapter_number = chunk.chapterNumber;
	setAttribute( span, 'data-chapter-number', last_span_data_chapter_number );
	var last_span_data_verse_number = chunk.verseNumber;
	setAttribute( span, 'data-verse-number', last_span_data_verse_number );
	var last_span_data_section_number = chunk.sectionNumber;
	setAttribute( span, 'data-section-number', last_span_data_section_number );
	
	var last_text = chunk.text
	var text = createText( last_text );
	appendNode( text, span );

	return {
		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, paragraph, paragraph__index, eachBlock1_value, chunk, chunk__index ) {
			var __tmp;
		
			if ( ( __tmp = chunk.chapterNumber ) !== last_span_data_chapter_number ) {
				last_span_data_chapter_number = __tmp;
				setAttribute( span, 'data-chapter-number', last_span_data_chapter_number );
			}
			
			if ( ( __tmp = chunk.verseNumber ) !== last_span_data_verse_number ) {
				last_span_data_verse_number = __tmp;
				setAttribute( span, 'data-verse-number', last_span_data_verse_number );
			}
			
			if ( ( __tmp = chunk.sectionNumber ) !== last_span_data_section_number ) {
				last_span_data_section_number = __tmp;
				setAttribute( span, 'data-section-number', last_span_data_section_number );
			}
			
			if ( ( __tmp = chunk.text ) !== last_text ) {
				text.data = last_text = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( span );
			}
		}
	};
}

function paragraphs ( options ) {
	options = options || {};
	
	this._state = Object.assign( template.data(), options.data );
applyComputations( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root;
	this._yield = options._yield;

	this._torndown = false;
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
}

paragraphs.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

paragraphs.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

paragraphs.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

paragraphs.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

paragraphs.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

paragraphs.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

paragraphs.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	applyComputations( this._state, newState, oldState, false )
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

paragraphs.prototype.teardown = function teardown ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function createComment() {
	return document.createComment( '' );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function teardownEach( iterations, detach, start ) {
	for ( var i = ( start || 0 ); i < iterations.length; i += 1 ) {
		iterations[i].teardown( detach );
	}
}

function createElement( name ) {
	return document.createElement( name );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function setAttribute( node, attribute, value ) {
	node.setAttribute ( attribute, value );
}

function createText( data ) {
	return document.createTextNode( data );
}

module.exports = paragraphs;

},{}],13:[function(require,module,exports){
'use strict';

var template = (function () {
const Paragraphs = require('./paragraphs.html')
const Subsections = require('./subsections.html')
const SectionLine = require('./section-line.html')

const extractRangeFromVerses = require('../extract-range-from-verses')
const getChiasmColor = require('../chiasm-color')

return {
	data() {
		return {

		}
	},
	components: {
		Paragraphs,
		Subsections,
		SectionLine
	},
	methods: {
		setChiasm(identifier) {
			const currentChiasm = this.get('currentChiasm')

			const newChiasm = currentChiasm === identifier ? null : identifier

			this.set({ currentChiasm: newChiasm })
		}
	},
	helpers: {
		getChiasmColor,
		extractRangeFromVerses
	}
}
}());

let addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\n[svelte-1168587148].chiasm-section, [svelte-1168587148] .chiasm-section {\n\tdisplay: flex;\n}\n\n[svelte-1168587148].section-body, [svelte-1168587148] .section-body {\n\tdisplay: flex;\n\tflex-grow: 1;\n\tflex-direction: column;\n}\n\n[svelte-1168587148].section-color-bar, [svelte-1168587148] .section-color-bar {\n\twidth: 50px;\n\tflex-shrink: 0;\n\tcursor: pointer;\n}\n\n[svelte-1168587148][data-chiasm-selected=true] [data-is-selected=false], [svelte-1168587148] [data-chiasm-selected=true] [data-is-selected=false] {\n\tdisplay: none;\n}\n\n[svelte-1168587148][data-chiasm-selected=true] [data-is-selected=true], [svelte-1168587148] [data-chiasm-selected=true] [data-is-selected=true] {\n\tmargin-bottom: 20px;\n}\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var div = createElement( 'div' );
	setAttribute( div, 'svelte-1168587148', '' );
	var last_div_data_chiasm_selected = !!root.currentChiasm;
	setAttribute( div, 'data-chiasm-selected', last_div_data_chiasm_selected );
	
	var eachBlock_anchor = createComment();
	appendNode( eachBlock_anchor, div );
	var eachBlock_value = root.structuredText;
	var eachBlock_iterations = [];
	
	for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
		eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
		eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
	}

	return {
		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( ( __tmp = !!root.currentChiasm ) !== last_div_data_chiasm_selected ) {
				last_div_data_chiasm_selected = __tmp;
				setAttribute( div, 'data-chiasm-selected', last_div_data_chiasm_selected );
			}
			
			var eachBlock_value = root.structuredText;
			
			for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
				if ( !eachBlock_iterations[i] ) {
					eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
					eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
				} else {
					eachBlock_iterations[i].update( changed, root, eachBlock_value, eachBlock_value[i], i );
				}
			}
			
			teardownEach( eachBlock_iterations, true, eachBlock_value.length );
			
			eachBlock_iterations.length = eachBlock_value.length;
		},
		
		teardown: function ( detach ) {
			teardownEach( eachBlock_iterations, false );
			
			if ( detach ) {
				detachNode( div );
			}
		}
	};
}

function renderEachBlock ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var div = createElement( 'div' );
	setAttribute( div, 'svelte-1168587148', '' );
	div.className = "chiasm-section";
	var last_div_data_is_selected = root.currentChiasm && root.currentChiasm === outerChiasm.identifier;
	setAttribute( div, 'data-is-selected', last_div_data_is_selected );
	
	var div1 = createElement( 'div' );
	setAttribute( div1, 'svelte-1168587148', '' );
	div1.className = "section-color-bar";
	div1.style.cssText = "background-color: " + ( template.helpers.getChiasmColor(outerChiasm.identifier) );
	
	function clickHandler ( event ) {
		var eachBlock_value = this.__svelte.eachBlock_value, outerChiasm__index = this.__svelte.outerChiasm__index, outerChiasm = eachBlock_value[outerChiasm__index]
		
		component.setChiasm(outerChiasm.identifier);
	}
	
	addEventListener( div1, 'click', clickHandler );
	
	div1.__svelte = {
		eachBlock_value: eachBlock_value,
		outerChiasm__index: outerChiasm__index
	};
	
	appendNode( div1, div );
	appendNode( createText( "\n\t\t\t" ), div );
	
	var div2 = createElement( 'div' );
	setAttribute( div2, 'svelte-1168587148', '' );
	div2.className = "section-body";
	
	appendNode( div2, div );
	var sectionLine_yieldFragment = rendersectionLineYieldFragment( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
	
	var sectionLine_initialData = {
		descriptionClass: "header-margin",
		description: outerChiasm.description
	};
	var sectionLine = new template.components.SectionLine({
		target: div2,
		_root: component._root || component,
		_yield: sectionLine_yieldFragment,
		data: sectionLine_initialData
	});
	
	appendNode( createText( "\n\n\t\t\t\t" ), div2 );
	var ifBlock_anchor = createComment();
	appendNode( ifBlock_anchor, div2 );
	
	function getBlock ( root, eachBlock_value, outerChiasm, outerChiasm__index ) {
		if ( outerChiasm.introduction ) return renderIfBlock_0;
		return null;
	}
	
	var currentBlock = getBlock( root, eachBlock_value, outerChiasm, outerChiasm__index );
	var ifBlock = currentBlock && currentBlock( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
	
	if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );
	appendNode( createText( "\n\n\t\t\t\t" ), div2 );
	var ifBlock2_anchor = createComment();
	appendNode( ifBlock2_anchor, div2 );
	
	function getBlock2 ( root, eachBlock_value, outerChiasm, outerChiasm__index ) {
		if ( outerChiasm.subsections ) return renderIfBlock2_0;
		return renderIfBlock2_1;
	}
	
	var currentBlock2 = getBlock2( root, eachBlock_value, outerChiasm, outerChiasm__index );
	var ifBlock2 = currentBlock2 && currentBlock2( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
	
	if ( ifBlock2 ) ifBlock2.mount( ifBlock2_anchor.parentNode, ifBlock2_anchor );

	return {
		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			if ( ( __tmp = root.currentChiasm && root.currentChiasm === outerChiasm.identifier ) !== last_div_data_is_selected ) {
				last_div_data_is_selected = __tmp;
				setAttribute( div, 'data-is-selected', last_div_data_is_selected );
			}
			
			div1.style.cssText = "background-color: " + ( template.helpers.getChiasmColor(outerChiasm.identifier) );
			
			div1.__svelte.eachBlock_value = eachBlock_value;
			div1.__svelte.outerChiasm__index = outerChiasm__index;
			
			sectionLine_yieldFragment.update( changed, root, eachBlock_value, outerChiasm, outerChiasm__index );
			
			var sectionLine_changes = {};
			
			if ( 'structuredText' in changed ) sectionLine_changes.description = outerChiasm.description;
			
			if ( Object.keys( sectionLine_changes ).length ) sectionLine.set( sectionLine_changes );
			
			var _currentBlock = currentBlock;
			currentBlock = getBlock( root, eachBlock_value, outerChiasm, outerChiasm__index );
			if ( _currentBlock === currentBlock && ifBlock) {
				ifBlock.update( changed, root, eachBlock_value, outerChiasm, outerChiasm__index );
			} else {
				if ( ifBlock ) ifBlock.teardown( true );
				ifBlock = currentBlock && currentBlock( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
				if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );
			}
			
			var _currentBlock2 = currentBlock2;
			currentBlock2 = getBlock2( root, eachBlock_value, outerChiasm, outerChiasm__index );
			if ( _currentBlock2 === currentBlock2 && ifBlock2) {
				ifBlock2.update( changed, root, eachBlock_value, outerChiasm, outerChiasm__index );
			} else {
				if ( ifBlock2 ) ifBlock2.teardown( true );
				ifBlock2 = currentBlock2 && currentBlock2( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
				if ( ifBlock2 ) ifBlock2.mount( ifBlock2_anchor.parentNode, ifBlock2_anchor );
			}
		},
		
		teardown: function ( detach ) {
			removeEventListener( div1, 'click', clickHandler );
			sectionLine.teardown( false );
			if ( ifBlock ) ifBlock.teardown( false );
			if ( ifBlock2 ) ifBlock2.teardown( false );
			
			if ( detach ) {
				detachNode( div );
			}
		}
	};
}

function renderIfBlock2_1 ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var sectionLine_yieldFragment = rendersectionLineYieldFragment2( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
	
	var sectionLine = new template.components.SectionLine({
		target: null,
		_root: component._root || component,
		_yield: sectionLine_yieldFragment
	});

	return {
		mount: function ( target, anchor ) {
			sectionLine._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			sectionLine_yieldFragment.update( changed, root, eachBlock_value, outerChiasm, outerChiasm__index );
		},
		
		teardown: function ( detach ) {
			sectionLine.teardown( detach );
		}
	};
}

function rendersectionLineYieldFragment2 ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var paragraphs_initialData = {
		verses: template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.range)
	};
	var paragraphs = new template.components.Paragraphs({
		target: null,
		_root: component._root || component,
		data: paragraphs_initialData
	});

	return {
		mount: function ( target, anchor ) {
			paragraphs._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			var paragraphs_changes = {};
			
			if ( 'structuredText' in changed||'structuredText' in changed ) paragraphs_changes.verses = template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.range);
			
			if ( Object.keys( paragraphs_changes ).length ) paragraphs.set( paragraphs_changes );
		},
		
		teardown: function ( detach ) {
			paragraphs.teardown( detach );
		}
	};
}

function renderIfBlock2_0 ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var subsections_initialData = {
		subsections: outerChiasm.subsections,
		verses: template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.range),
		useColor: !!root.currentChiasm
	};
	var subsections = new template.components.Subsections({
		target: null,
		_root: component._root || component,
		data: subsections_initialData
	});

	return {
		mount: function ( target, anchor ) {
			subsections._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			var subsections_changes = {};
			
			if ( 'structuredText' in changed ) subsections_changes.subsections = outerChiasm.subsections;
			if ( 'structuredText' in changed||'structuredText' in changed ) subsections_changes.verses = template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.range);
			if ( 'currentChiasm' in changed ) subsections_changes.useColor = !!root.currentChiasm;
			
			if ( Object.keys( subsections_changes ).length ) subsections.set( subsections_changes );
		},
		
		teardown: function ( detach ) {
			subsections.teardown( detach );
		}
	};
}

function renderIfBlock_0 ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var ifBlock1_anchor = createComment();
	
	function getBlock1 ( root, eachBlock_value, outerChiasm, outerChiasm__index ) {
		if ( outerChiasm.introduction.subsections ) return renderIfBlock1_0;
		return renderIfBlock1_1;
	}
	
	var currentBlock1 = getBlock1( root, eachBlock_value, outerChiasm, outerChiasm__index );
	var ifBlock1 = currentBlock1 && currentBlock1( root, eachBlock_value, outerChiasm, outerChiasm__index, component );

	return {
		mount: function ( target, anchor ) {
			insertNode( ifBlock1_anchor, target, anchor );
			if ( ifBlock1 ) ifBlock1.mount( ifBlock1_anchor.parentNode, ifBlock1_anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			var _currentBlock1 = currentBlock1;
			currentBlock1 = getBlock1( root, eachBlock_value, outerChiasm, outerChiasm__index );
			if ( _currentBlock1 === currentBlock1 && ifBlock1) {
				ifBlock1.update( changed, root, eachBlock_value, outerChiasm, outerChiasm__index );
			} else {
				if ( ifBlock1 ) ifBlock1.teardown( true );
				ifBlock1 = currentBlock1 && currentBlock1( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
				if ( ifBlock1 ) ifBlock1.mount( ifBlock1_anchor.parentNode, ifBlock1_anchor );
			}
		},
		
		teardown: function ( detach ) {
			if ( ifBlock1 ) ifBlock1.teardown( detach );
			
			if ( detach ) {
				detachNode( ifBlock1_anchor );
			}
		}
	};
}

function renderIfBlock1_1 ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var sectionLine_yieldFragment = rendersectionLineYieldFragment1( root, eachBlock_value, outerChiasm, outerChiasm__index, component );
	
	var sectionLine_initialData = {
		description: outerChiasm.introduction.title
	};
	var sectionLine = new template.components.SectionLine({
		target: null,
		_root: component._root || component,
		_yield: sectionLine_yieldFragment,
		data: sectionLine_initialData
	});

	return {
		mount: function ( target, anchor ) {
			sectionLine._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			sectionLine_yieldFragment.update( changed, root, eachBlock_value, outerChiasm, outerChiasm__index );
			
			var sectionLine_changes = {};
			
			if ( 'structuredText' in changed ) sectionLine_changes.description = outerChiasm.introduction.title;
			
			if ( Object.keys( sectionLine_changes ).length ) sectionLine.set( sectionLine_changes );
		},
		
		teardown: function ( detach ) {
			sectionLine.teardown( detach );
		}
	};
}

function rendersectionLineYieldFragment1 ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var paragraphs_initialData = {
		verses: template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.introduction.range)
	};
	var paragraphs = new template.components.Paragraphs({
		target: null,
		_root: component._root || component,
		data: paragraphs_initialData
	});

	return {
		mount: function ( target, anchor ) {
			paragraphs._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			var paragraphs_changes = {};
			
			if ( 'structuredText' in changed||'structuredText' in changed ) paragraphs_changes.verses = template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.introduction.range);
			
			if ( Object.keys( paragraphs_changes ).length ) paragraphs.set( paragraphs_changes );
		},
		
		teardown: function ( detach ) {
			paragraphs.teardown( detach );
		}
	};
}

function renderIfBlock1_0 ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var subsections_initialData = {
		subsections: outerChiasm.introduction.subsections,
		verses: template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.introduction.range),
		useColor: !!root.currentChiasm
	};
	var subsections = new template.components.Subsections({
		target: null,
		_root: component._root || component,
		data: subsections_initialData
	});

	return {
		mount: function ( target, anchor ) {
			subsections._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			var subsections_changes = {};
			
			if ( 'structuredText' in changed ) subsections_changes.subsections = outerChiasm.introduction.subsections;
			if ( 'structuredText' in changed||'structuredText' in changed ) subsections_changes.verses = template.helpers.extractRangeFromVerses(outerChiasm.verses, outerChiasm.introduction.range);
			if ( 'currentChiasm' in changed ) subsections_changes.useColor = !!root.currentChiasm;
			
			if ( Object.keys( subsections_changes ).length ) subsections.set( subsections_changes );
		},
		
		teardown: function ( detach ) {
			subsections.teardown( detach );
		}
	};
}

function rendersectionLineYieldFragment ( root, eachBlock_value, outerChiasm, outerChiasm__index, component ) {
	var h1 = createElement( 'h1' );
	setAttribute( h1, 'svelte-1168587148', '' );
	h1.style.cssText = "color: " + ( template.helpers.getChiasmColor(outerChiasm.identifier) );
	
	var last_text = outerChiasm.title
	var text = createText( last_text );
	appendNode( text, h1 );

	return {
		mount: function ( target, anchor ) {
			insertNode( h1, target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, outerChiasm, outerChiasm__index ) {
			var __tmp;
		
			h1.style.cssText = "color: " + ( template.helpers.getChiasmColor(outerChiasm.identifier) );
			
			if ( ( __tmp = outerChiasm.title ) !== last_text ) {
				text.data = last_text = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( h1 );
			}
		}
	};
}

function revelation ( options ) {
	options = options || {};
	
	this._state = Object.assign( template.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root;
	this._yield = options._yield;

	this._torndown = false;
	if ( !addedCss ) addCss();
	this._renderHooks = [];
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	this._flush();
}

revelation.prototype = template.methods;

revelation.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

revelation.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

revelation.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

revelation.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

revelation.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

revelation.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

revelation.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
	
	this._flush();
};

revelation.prototype.teardown = function teardown ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function setAttribute( node, attribute, value ) {
	node.setAttribute ( attribute, value );
}

function createElement( name ) {
	return document.createElement( name );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function createComment() {
	return document.createComment( '' );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function teardownEach( iterations, detach, start ) {
	for ( var i = ( start || 0 ); i < iterations.length; i += 1 ) {
		iterations[i].teardown( detach );
	}
}

function addEventListener( node, event, handler ) {
	node.addEventListener ( event, handler, false );
}

function removeEventListener( node, event, handler ) {
	node.removeEventListener ( event, handler, false );
}

function createText( data ) {
	return document.createTextNode( data );
}

module.exports = revelation;

},{"../chiasm-color":1,"../extract-range-from-verses":3,"./paragraphs.html":12,"./section-line.html":14,"./subsections.html":15}],14:[function(require,module,exports){
'use strict';

var template = (function () {
return {
	data() {
		return {
			descriptionClass: 'paragraph-margin'
		}
	}
}
}());

function renderMainFragment ( root, component ) {
	var div = createElement( 'div' );
	div.className = "section-line";
	
	var div1 = createElement( 'div' );
	div1.className = "section-text";
	
	appendNode( div1, div );
	var yield_anchor = createComment();
	appendNode( yield_anchor, div1 );
	appendNode( createText( "\n\t" ), div );
	
	var div2 = createElement( 'div' );
	div2.className = "section-description " + ( root.descriptionClass );
	
	appendNode( div2, div );
	var last_text1 = root.description || ''
	var text1 = createText( last_text1 );
	appendNode( text1, div2 );

	return {
		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
			component._yield && component._yield.mount( div1, yield_anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			div2.className = "section-description " + ( root.descriptionClass );
			
			if ( ( __tmp = root.description || '' ) !== last_text1 ) {
				text1.data = last_text1 = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			component._yield && component._yield.teardown( detach );
			
			if ( detach ) {
				detachNode( div );
			}
		}
	};
}

function sectionline ( options ) {
	options = options || {};
	
	this._state = Object.assign( template.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root;
	this._yield = options._yield;

	this._torndown = false;
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
}

sectionline.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

sectionline.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

sectionline.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

sectionline.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

sectionline.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

sectionline.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

sectionline.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

sectionline.prototype.teardown = function teardown ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function createElement( name ) {
	return document.createElement( name );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function createComment() {
	return document.createComment( '' );
}

function createText( data ) {
	return document.createTextNode( data );
}

module.exports = sectionline;

},{}],15:[function(require,module,exports){
'use strict';

function applyComputations ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'subsections' in newState && typeof state.subsections === 'object' || state.subsections !== oldState.subsections ) || ( 'verses' in newState && typeof state.verses === 'object' || state.verses !== oldState.verses ) ) {
		state.subsectionsWithVerses = newState.subsectionsWithVerses = template.computed.subsectionsWithVerses( state.subsections, state.verses );
	}
}

var template = (function () {
const combineStructureAndVerses = require('../combine-structure-and-verses')
const getChiasmColor = require('../chiasm-color')
// const extractRangeFromVerses = require('../extract-range-from-verses')

const Paragraphs = require('./paragraphs.html')
const SectionLine = require('./section-line.html')

return {
	data() {
		return {
			useColor: false
		}
	},
	components: {
		Paragraphs,
		SectionLine
	},
	computed: {
		subsectionsWithVerses(subsections, verses) {
			return combineStructureAndVerses(subsections, verses)
		}
	},
	helpers: {
		getChiasmColor
	}
}
}());

function renderMainFragment ( root, component ) {
	var eachBlock_anchor = createComment();
	var eachBlock_value = root.subsectionsWithVerses;
	var eachBlock_iterations = [];
	
	for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
		eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
	}

	return {
		mount: function ( target, anchor ) {
			insertNode( eachBlock_anchor, target, anchor );
			
			for ( var i = 0; i < eachBlock_iterations.length; i += 1 ) {
				eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
			}
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			var eachBlock_value = root.subsectionsWithVerses;
			
			for ( var i = 0; i < eachBlock_value.length; i += 1 ) {
				if ( !eachBlock_iterations[i] ) {
					eachBlock_iterations[i] = renderEachBlock( root, eachBlock_value, eachBlock_value[i], i, component );
					eachBlock_iterations[i].mount( eachBlock_anchor.parentNode, eachBlock_anchor );
				} else {
					eachBlock_iterations[i].update( changed, root, eachBlock_value, eachBlock_value[i], i );
				}
			}
			
			teardownEach( eachBlock_iterations, true, eachBlock_value.length );
			
			eachBlock_iterations.length = eachBlock_value.length;
		},
		
		teardown: function ( detach ) {
			teardownEach( eachBlock_iterations, detach );
			
			if ( detach ) {
				detachNode( eachBlock_anchor );
			}
		}
	};
}

function renderEachBlock ( root, eachBlock_value, subsection, subsection__index, component ) {
	var sectionLine_yieldFragment = rendersectionLineYieldFragment( root, eachBlock_value, subsection, subsection__index, component );
	
	var sectionLine_initialData = {
		description: subsection.title
	};
	var sectionLine = new template.components.SectionLine({
		target: null,
		_root: component._root || component,
		_yield: sectionLine_yieldFragment,
		data: sectionLine_initialData
	});

	return {
		mount: function ( target, anchor ) {
			sectionLine._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, subsection, subsection__index ) {
			var __tmp;
		
			sectionLine_yieldFragment.update( changed, root, eachBlock_value, subsection, subsection__index );
			
			var sectionLine_changes = {};
			
			if ( 'subsectionsWithVerses' in changed ) sectionLine_changes.description = subsection.title;
			
			if ( Object.keys( sectionLine_changes ).length ) sectionLine.set( sectionLine_changes );
		},
		
		teardown: function ( detach ) {
			sectionLine.teardown( detach );
		}
	};
}

function rendersectionLineYieldFragment ( root, eachBlock_value, subsection, subsection__index, component ) {
	var paragraphs_initialData = {
		verses: subsection.verses,
		color: root.useColor && subsection.identifier && template.helpers.getChiasmColor(subsection.identifier)
	};
	var paragraphs = new template.components.Paragraphs({
		target: null,
		_root: component._root || component,
		data: paragraphs_initialData
	});

	return {
		mount: function ( target, anchor ) {
			paragraphs._fragment.mount( target, anchor );
		},
		
		update: function ( changed, root, eachBlock_value, subsection, subsection__index ) {
			var __tmp;
		
			var paragraphs_changes = {};
			
			if ( 'subsectionsWithVerses' in changed ) paragraphs_changes.verses = subsection.verses;
			if ( 'useColor' in changed||'subsectionsWithVerses' in changed||'subsectionsWithVerses' in changed ) paragraphs_changes.color = root.useColor && subsection.identifier && template.helpers.getChiasmColor(subsection.identifier);
			
			if ( Object.keys( paragraphs_changes ).length ) paragraphs.set( paragraphs_changes );
		},
		
		teardown: function ( detach ) {
			paragraphs.teardown( detach );
		}
	};
}

function subsections ( options ) {
	options = options || {};
	
	this._state = Object.assign( template.data(), options.data );
applyComputations( this._state, this._state, {}, true );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root;
	this._yield = options._yield;

	this._torndown = false;
	this._renderHooks = [];
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	this._flush();
}

subsections.prototype.get = function get( key ) {
 	return key ? this._state[ key ] : this._state;
 };

subsections.prototype.fire = function fire( eventName, data ) {
 	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
 	if ( !handlers ) return;
 
 	for ( var i = 0; i < handlers.length; i += 1 ) {
 		handlers[i].call( this, data );
 	}
 };

subsections.prototype.observe = function observe( key, callback, options ) {
 	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;
 
 	( group[ key ] || ( group[ key ] = [] ) ).push( callback );
 
 	if ( !options || options.init !== false ) {
 		callback.__calling = true;
 		callback.call( this, this._state[ key ] );
 		callback.__calling = false;
 	}
 
 	return {
 		cancel: function () {
 			var index = group[ key ].indexOf( callback );
 			if ( ~index ) group[ key ].splice( index, 1 );
 		}
 	};
 };

subsections.prototype.on = function on( eventName, handler ) {
 	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
 	handlers.push( handler );
 
 	return {
 		cancel: function () {
 			var index = handlers.indexOf( handler );
 			if ( ~index ) handlers.splice( index, 1 );
 		}
 	};
 };

subsections.prototype.set = function set( newState ) {
 	this._set( newState );
 	( this._root || this )._flush();
 };

subsections.prototype._flush = function _flush() {
 	if ( !this._renderHooks ) return;
 
 	while ( this._renderHooks.length ) {
 		var hook = this._renderHooks.pop();
 		hook.fn.call( hook.context );
 	}
 };

subsections.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	applyComputations( this._state, newState, oldState, false )
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
	
	this._flush();
};

subsections.prototype.teardown = function teardown ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function createComment() {
	return document.createComment( '' );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function teardownEach( iterations, detach, start ) {
	for ( var i = ( start || 0 ); i < iterations.length; i += 1 ) {
		iterations[i].teardown( detach );
	}
}

module.exports = subsections;

},{"../chiasm-color":1,"../combine-structure-and-verses":2,"./paragraphs.html":12,"./section-line.html":14}],16:[function(require,module,exports){
'use strict';

var slugify = require('slugify');

var Revelation = require('./template/revelation.html');

function headerToSlug(header) {
	return 'header-' + slugify(header.toLowerCase());
}

module.exports = function makeMainView(_ref) {
	var targetSelector = _ref.targetSelector,
	    structuredText = _ref.structuredText;

	return new Revelation({
		target: document.querySelector(targetSelector),
		data: {
			structuredText: structuredText,
			currentChiasm: null
		}
	});
};

},{"./template/revelation.html":13,"slugify":10}]},{},[4]);
