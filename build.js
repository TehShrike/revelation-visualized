(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Ractive = require('ractive');
var template = require('./revelation.html');
var addVersesToStructure = require('./structured-text');
var revelation = require('pickering-majority-text-revelation');
var slugify = require('slugify');

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

var structuredText = addVersesToStructure(verses);

console.log(structuredText);

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

function getChiasmColor(identifier) {
	var key = identifier[identifier.length - 1].toLowerCase();
	var colorIndex = chiasmColors[key];
	return colors[colorIndex];
}

function headerToSlug(header) {
	return 'header-' + slugify(header.toLowerCase());
}

function splitIntoParagraphs(chunks) {
	var paragraphs = [];
	var currentParagraph = [];

	function finishParagraph() {
		paragraphs.push(currentParagraph);
		currentParagraph = [];
	}

	chunks.forEach(function (chunk) {
		if (chunk.type === 'paragraph break') {
			finishParagraph();
		} else {
			currentParagraph.push(chunk);
		}
	});

	if (currentParagraph.length > 0) {
		finishParagraph();
	}

	return paragraphs;
}

var Paragraphs = Ractive.extend({
	template: require('./paragraphs.html'),
	twoway: false,
	data: function data() {
		return {
			headerToSlug: headerToSlug,
			colors: colors
		};
	},
	computed: {
		paragraphs: function paragraphs() {
			return splitIntoParagraphs(this.get('verses'));
		}
	}
});

new Ractive({
	el: '#verses',
	template: template,
	data: {
		structuredText: structuredText,
		getChiasmColor: getChiasmColor,
		currentChiasm: null
	},
	components: {
		Paragraphs: Paragraphs
	},
	setChiasm: function setChiasm(identifier) {
		var currentChiasm = this.get('currentChiasm');

		var newChiasm = currentChiasm === identifier ? null : identifier;

		this.set('currentChiasm', newChiasm);
	}
});

},{"./paragraphs.html":9,"./revelation.html":10,"./structured-text":12,"pickering-majority-text-revelation":4,"ractive":7,"slugify":8}],2:[function(require,module,exports){

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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
var versesNoteReferencesAndHeaders = require('./verses-note-references-and-headers.json')
var notes = require('./notes.json')

module.exports = {
	versesNoteReferencesAndHeaders: versesNoteReferencesAndHeaders,
	notes: notes
}

},{"./notes.json":5,"./verses-note-references-and-headers.json":6}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
		"text": "Here is wisdom: let the one who has understanding evaluate the number of the Beast, for it is the number of man—his number is",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 13,
		"verseNumber": 6,
		"text": ".",
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
		"text": "And they sing a new song before the Throne, and before the four living beings and the elders; and no one was able to learn the song except the",
		"sectionNumber": 1
	},
	{
		"type": "verse",
		"chapterNumber": 14,
		"verseNumber": 4,
		"text": "thousand, who had been redeemed from the earth. These are the ones not defiled with women, for they are virgins;",
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
},{}],7:[function(require,module,exports){
(function (global){
/*
	Ractive.js v0.8.11
	Mon Feb 20 2017 08:44:41 GMT+0000 (UTC) - commit 2220e19d2fdfd5d046ef146496322c5c6df663c9

	http://ractivejs.org
	http://twitter.com/RactiveJS

	Released under the MIT License.
*/


(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	((function() { var current = global.Ractive; var next = factory(); next.noConflict = function() { global.Ractive = current; return next; }; return global.Ractive = next; })());
}(this, function () { 'use strict';

	var defaults = {
		// render placement:
		el:                     void 0,
		append:				    false,

		// template:
		template:               null,

		// parse:
		delimiters:             [ '{{', '}}' ],
		tripleDelimiters:       [ '{{{', '}}}' ],
		staticDelimiters:       [ '[[', ']]' ],
		staticTripleDelimiters: [ '[[[', ']]]' ],
		csp: 					true,
		interpolate:            false,
		preserveWhitespace:     false,
		sanitize:               false,
		stripComments:          true,
		contextLines:           0,

		// data & binding:
		data:                   {},
		computed:               {},
		magic:                  false,
		modifyArrays:           false,
		adapt:                  [],
		isolated:               false,
		twoway:                 true,
		lazy:                   false,

		// transitions:
		noIntro:                false,
		transitionsEnabled:     true,
		complete:               void 0,

		// css:
		css:                    null,
		noCssTransform:         false
	};

	// These are a subset of the easing equations found at
	// https://raw.github.com/danro/easing-js - license info
	// follows:

	// --------------------------------------------------
	// easing.js v0.5.4
	// Generic set of easing functions with AMD support
	// https://github.com/danro/easing-js
	// This code may be freely distributed under the MIT license
	// http://danro.mit-license.org/
	// --------------------------------------------------
	// All functions adapted from Thomas Fuchs & Jeremy Kahn
	// Easing Equations (c) 2003 Robert Penner, BSD license
	// https://raw.github.com/danro/easing-js/master/LICENSE
	// --------------------------------------------------

	// In that library, the functions named easeIn, easeOut, and
	// easeInOut below are named easeInCubic, easeOutCubic, and
	// (you guessed it) easeInOutCubic.
	//
	// You can add additional easing functions to this list, and they
	// will be globally available.


	var easing = {
		linear: function ( pos ) { return pos; },
		easeIn: function ( pos ) { return Math.pow( pos, 3 ); },
		easeOut: function ( pos ) { return ( Math.pow( ( pos - 1 ), 3 ) + 1 ); },
		easeInOut: function ( pos ) {
			if ( ( pos /= 0.5 ) < 1 ) { return ( 0.5 * Math.pow( pos, 3 ) ); }
			return ( 0.5 * ( Math.pow( ( pos - 2 ), 3 ) + 2 ) );
		}
	};

	var legacy = null;

	/*global console, navigator */

	var win = typeof window !== 'undefined' ? window : null;
	var doc = win ? document : null;

	var isClient = !!doc;
	var isJsdom = ( typeof navigator !== 'undefined' && /jsDom/.test( navigator.appName ) );
	var hasConsole = ( typeof console !== 'undefined' && typeof console.warn === 'function' && typeof console.warn.apply === 'function' );

	var magicSupported;
	try {
		Object.defineProperty({}, 'test', { value: 0 });
		magicSupported = true;
	} catch ( e ) {
		magicSupported = false;
	}

	var svg = doc ?
		doc.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1' ) :
		false;

	var vendors = [ 'o', 'ms', 'moz', 'webkit' ];

	var html   = 'http://www.w3.org/1999/xhtml';
	var mathml = 'http://www.w3.org/1998/Math/MathML';
	var svg$1    = 'http://www.w3.org/2000/svg';
	var xlink  = 'http://www.w3.org/1999/xlink';
	var xml    = 'http://www.w3.org/XML/1998/namespace';
	var xmlns  = 'http://www.w3.org/2000/xmlns';

	var namespaces = { html: html, mathml: mathml, svg: svg$1, xlink: xlink, xml: xml, xmlns: xmlns };

	var createElement;
	var matches;
	var div;
	var methodNames;
	var unprefixed;
	var prefixed;
	var i;
	var j;
	var makeFunction;
	// Test for SVG support
	if ( !svg ) {
		createElement = function ( type, ns, extend ) {
			if ( ns && ns !== html ) {
				throw 'This browser does not support namespaces other than http://www.w3.org/1999/xhtml. The most likely cause of this error is that you\'re trying to render SVG in an older browser. See http://docs.ractivejs.org/latest/svg-and-older-browsers for more information';
			}

			return extend ?
				doc.createElement( type, extend ) :
				doc.createElement( type );
		};
	} else {
		createElement = function ( type, ns, extend ) {
			if ( !ns || ns === html ) {
				return extend ?
					doc.createElement( type, extend ) :
					doc.createElement( type );
			}

			return extend ?
				doc.createElementNS( ns, type, extend ) :
				doc.createElementNS( ns, type );
		};
	}

	function createDocumentFragment () {
		return doc.createDocumentFragment();
	}

	function getElement ( input ) {
		var output;

		if ( !input || typeof input === 'boolean' ) { return; }

		if ( !win || !doc || !input ) {
			return null;
		}

		// We already have a DOM node - no work to do. (Duck typing alert!)
		if ( input.nodeType ) {
			return input;
		}

		// Get node from string
		if ( typeof input === 'string' ) {
			// try ID first
			output = doc.getElementById( input );

			// then as selector, if possible
			if ( !output && doc.querySelector ) {
				output = doc.querySelector( input );
			}

			// did it work?
			if ( output && output.nodeType ) {
				return output;
			}
		}

		// If we've been given a collection (jQuery, Zepto etc), extract the first item
		if ( input[0] && input[0].nodeType ) {
			return input[0];
		}

		return null;
	}

	if ( !isClient ) {
		matches = null;
	} else {
		div = createElement( 'div' );
		methodNames = [ 'matches', 'matchesSelector' ];

		makeFunction = function ( methodName ) {
			return function ( node, selector ) {
				return node[ methodName ]( selector );
			};
		};

		i = methodNames.length;

		while ( i-- && !matches ) {
			unprefixed = methodNames[i];

			if ( div[ unprefixed ] ) {
				matches = makeFunction( unprefixed );
			} else {
				j = vendors.length;
				while ( j-- ) {
					prefixed = vendors[i] + unprefixed.substr( 0, 1 ).toUpperCase() + unprefixed.substring( 1 );

					if ( div[ prefixed ] ) {
						matches = makeFunction( prefixed );
						break;
					}
				}
			}
		}

		// IE8...
		if ( !matches ) {
			matches = function ( node, selector ) {
				var nodes, parentNode, i;

				parentNode = node.parentNode;

				if ( !parentNode ) {
					// empty dummy <div>
					div.innerHTML = '';

					parentNode = div;
					node = node.cloneNode();

					div.appendChild( node );
				}

				nodes = parentNode.querySelectorAll( selector );

				i = nodes.length;
				while ( i-- ) {
					if ( nodes[i] === node ) {
						return true;
					}
				}

				return false;
			};
		}
	}

	function detachNode ( node ) {
		if ( node && typeof node.parentNode !== 'unknown' && node.parentNode ) {
			node.parentNode.removeChild( node );
		}

		return node;
	}

	function safeToStringValue ( value ) {
		return ( value == null || !value.toString ) ? '' : '' + value;
	}

	function safeAttributeString ( string ) {
		return safeToStringValue( string )
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#39;' );
	}

	var decamel = /[A-Z]/g;
	function decamelize ( string ) {
		return string.replace( decamel, function ( s ) { return ("-" + (s.toLowerCase())); } );
	}

	var create;
	var defineProperty;
	var defineProperties;
	try {
		Object.defineProperty({}, 'test', { get: function() {}, set: function() {} });

		if ( doc ) {
			Object.defineProperty( createElement( 'div' ), 'test', { value: 0 });
		}

		defineProperty = Object.defineProperty;
	} catch ( err ) {
		// Object.defineProperty doesn't exist, or we're in IE8 where you can
		// only use it with DOM objects (what were you smoking, MSFT?)
		defineProperty = function ( obj, prop, desc ) {
			if ( desc.get ) obj[ prop ] = desc.get();
			else obj[ prop ] = desc.value;
		};
	}

	try {
		try {
			Object.defineProperties({}, { test: { value: 0 } });
		} catch ( err ) {
			// TODO how do we account for this? noMagic = true;
			throw err;
		}

		if ( doc ) {
			Object.defineProperties( createElement( 'div' ), { test: { value: 0 } });
		}

		defineProperties = Object.defineProperties;
	} catch ( err ) {
		defineProperties = function ( obj, props ) {
			var prop;

			for ( prop in props ) {
				if ( props.hasOwnProperty( prop ) ) {
					defineProperty( obj, prop, props[ prop ] );
				}
			}
		};
	}

	try {
		Object.create( null );

		create = Object.create;
	} catch ( err ) {
		// sigh
		create = (function () {
			var F = function () {};

			return function ( proto, props ) {
				var obj;

				if ( proto === null ) {
					return {};
				}

				F.prototype = proto;
				obj = new F();

				if ( props ) {
					Object.defineProperties( obj, props );
				}

				return obj;
			};
		}());
	}

	function extendObj ( target ) {
		var sources = [], len = arguments.length - 1;
		while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];

		var prop;

		sources.forEach( function ( source ) {
			for ( prop in source ) {
				if ( hasOwn.call( source, prop ) ) {
					target[ prop ] = source[ prop ];
				}
			}
		});

		return target;
	}

	function fillGaps ( target ) {
		var sources = [], len = arguments.length - 1;
		while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];

		sources.forEach( function ( s ) {
			for ( var key in s ) {
				if ( hasOwn.call( s, key ) && !( key in target ) ) {
					target[ key ] = s[ key ];
				}
			}
		});

		return target;
	}

	var hasOwn = Object.prototype.hasOwnProperty;

	var toString = Object.prototype.toString;
	// thanks, http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
	function isArray ( thing ) {
		return toString.call( thing ) === '[object Array]';
	}

	function isEqual ( a, b ) {
		if ( a === null && b === null ) {
			return true;
		}

		if ( typeof a === 'object' || typeof b === 'object' ) {
			return false;
		}

		return a === b;
	}

	// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
	function isNumeric ( thing ) {
		return !isNaN( parseFloat( thing ) ) && isFinite( thing );
	}

	function isObject ( thing ) {
		return ( thing && toString.call( thing ) === '[object Object]' );
	}

	function noop () {}

	var alreadyWarned = {};
	var log;
	var printWarning;
	var welcome;
	if ( hasConsole ) {
		var welcomeIntro = [
			("%cRactive.js %c0.8.11 %cin debug mode, %cmore..."),
			'color: rgb(114, 157, 52); font-weight: normal;',
			'color: rgb(85, 85, 85); font-weight: normal;',
			'color: rgb(85, 85, 85); font-weight: normal;',
			'color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;'
		];
		var welcomeMessage = "You're running Ractive 0.8.11 in debug mode - messages will be printed to the console to help you fix problems and optimise your application.\n\nTo disable debug mode, add this line at the start of your app:\n  Ractive.DEBUG = false;\n\nTo disable debug mode when your app is minified, add this snippet:\n  Ractive.DEBUG = /unminified/.test(function(){/*unminified*/});\n\nGet help and support:\n  http://docs.ractivejs.org\n  http://stackoverflow.com/questions/tagged/ractivejs\n  http://groups.google.com/forum/#!forum/ractive-js\n  http://twitter.com/ractivejs\n\nFound a bug? Raise an issue:\n  https://github.com/ractivejs/ractive/issues\n\n";

		welcome = function () {
			if ( Ractive.WELCOME_MESSAGE === false ) {
				welcome = noop;
				return;
			}
			var message = 'WELCOME_MESSAGE' in Ractive ? Ractive.WELCOME_MESSAGE : welcomeMessage;
			var hasGroup = !!console.groupCollapsed;
			if ( hasGroup ) console.groupCollapsed.apply( console, welcomeIntro );
			console.log( message );
			if ( hasGroup ) {
				console.groupEnd( welcomeIntro );
			}

			welcome = noop;
		};

		printWarning = function ( message, args ) {
			welcome();

			// extract information about the instance this message pertains to, if applicable
			if ( typeof args[ args.length - 1 ] === 'object' ) {
				var options = args.pop();
				var ractive = options ? options.ractive : null;

				if ( ractive ) {
					// if this is an instance of a component that we know the name of, add
					// it to the message
					var name;
					if ( ractive.component && ( name = ractive.component.name ) ) {
						message = "<" + name + "> " + message;
					}

					var node;
					if ( node = ( options.node || ( ractive.fragment && ractive.fragment.rendered && ractive.find( '*' ) ) ) ) {
						args.push( node );
					}
				}
			}

			console.warn.apply( console, [ '%cRactive.js: %c' + message, 'color: rgb(114, 157, 52);', 'color: rgb(85, 85, 85);' ].concat( args ) );
		};

		log = function () {
			console.log.apply( console, arguments );
		};
	} else {
		printWarning = log = welcome = noop;
	}

	function format ( message, args ) {
		return message.replace( /%s/g, function () { return args.shift(); } );
	}

	function fatal ( message ) {
		var args = [], len = arguments.length - 1;
		while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

		message = format( message, args );
		throw new Error( message );
	}

	function logIfDebug () {
		if ( Ractive.DEBUG ) {
			log.apply( null, arguments );
		}
	}

	function warn ( message ) {
		var args = [], len = arguments.length - 1;
		while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

		message = format( message, args );
		printWarning( message, args );
	}

	function warnOnce ( message ) {
		var args = [], len = arguments.length - 1;
		while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

		message = format( message, args );

		if ( alreadyWarned[ message ] ) {
			return;
		}

		alreadyWarned[ message ] = true;
		printWarning( message, args );
	}

	function warnIfDebug () {
		if ( Ractive.DEBUG ) {
			warn.apply( null, arguments );
		}
	}

	function warnOnceIfDebug () {
		if ( Ractive.DEBUG ) {
			warnOnce.apply( null, arguments );
		}
	}

	// Error messages that are used (or could be) in multiple places
	var badArguments = 'Bad arguments';
	var noRegistryFunctionReturn = 'A function was specified for "%s" %s, but no %s was returned';
	var missingPlugin = function ( name, type ) { return ("Missing \"" + name + "\" " + type + " plugin. You may need to download a plugin via http://docs.ractivejs.org/latest/plugins#" + type + "s"); };

	function findInViewHierarchy ( registryName, ractive, name ) {
		var instance = findInstance( registryName, ractive, name );
		return instance ? instance[ registryName ][ name ] : null;
	}

	function findInstance ( registryName, ractive, name ) {
		while ( ractive ) {
			if ( name in ractive[ registryName ] ) {
				return ractive;
			}

			if ( ractive.isolated ) {
				return null;
			}

			ractive = ractive.parent;
		}
	}

	function interpolate ( from, to, ractive, type ) {
		if ( from === to ) return null;

		if ( type ) {
			var interpol = findInViewHierarchy( 'interpolators', ractive, type );
			if ( interpol ) return interpol( from, to ) || null;

			fatal( missingPlugin( type, 'interpolator' ) );
		}

		return interpolators.number( from, to ) ||
		       interpolators.array( from, to ) ||
		       interpolators.object( from, to ) ||
		       null;
	}

	function snap ( to ) {
		return function () { return to; };
	}

	var interpolators = {
		number: function ( from, to ) {
			var delta;

			if ( !isNumeric( from ) || !isNumeric( to ) ) {
				return null;
			}

			from = +from;
			to = +to;

			delta = to - from;

			if ( !delta ) {
				return function () { return from; };
			}

			return function ( t ) {
				return from + ( t * delta );
			};
		},

		array: function ( from, to ) {
			var intermediate, interpolators, len, i;

			if ( !isArray( from ) || !isArray( to ) ) {
				return null;
			}

			intermediate = [];
			interpolators = [];

			i = len = Math.min( from.length, to.length );
			while ( i-- ) {
				interpolators[i] = interpolate( from[i], to[i] );
			}

			// surplus values - don't interpolate, but don't exclude them either
			for ( i=len; i<from.length; i+=1 ) {
				intermediate[i] = from[i];
			}

			for ( i=len; i<to.length; i+=1 ) {
				intermediate[i] = to[i];
			}

			return function ( t ) {
				var i = len;

				while ( i-- ) {
					intermediate[i] = interpolators[i]( t );
				}

				return intermediate;
			};
		},

		object: function ( from, to ) {
			var properties, len, interpolators, intermediate, prop;

			if ( !isObject( from ) || !isObject( to ) ) {
				return null;
			}

			properties = [];
			intermediate = {};
			interpolators = {};

			for ( prop in from ) {
				if ( hasOwn.call( from, prop ) ) {
					if ( hasOwn.call( to, prop ) ) {
						properties.push( prop );
						interpolators[ prop ] = interpolate( from[ prop ], to[ prop ] ) || snap( to[ prop ] );
					}

					else {
						intermediate[ prop ] = from[ prop ];
					}
				}
			}

			for ( prop in to ) {
				if ( hasOwn.call( to, prop ) && !hasOwn.call( from, prop ) ) {
					intermediate[ prop ] = to[ prop ];
				}
			}

			len = properties.length;

			return function ( t ) {
				var i = len, prop;

				while ( i-- ) {
					prop = properties[i];

					intermediate[ prop ] = interpolators[ prop ]( t );
				}

				return intermediate;
			};
		}
	};

	// TODO: deprecate in future release
	var deprecations = {
		construct: {
			deprecated: 'beforeInit',
			replacement: 'onconstruct'
		},
		render: {
			deprecated: 'init',
			message: 'The "init" method has been deprecated ' +
				'and will likely be removed in a future release. ' +
				'You can either use the "oninit" method which will fire ' +
				'only once prior to, and regardless of, any eventual ractive ' +
				'instance being rendered, or if you need to access the ' +
				'rendered DOM, use "onrender" instead. ' +
				'See http://docs.ractivejs.org/latest/migrating for more information.'
		},
		complete: {
			deprecated: 'complete',
			replacement: 'oncomplete'
		}
	};

	var Hook = function Hook ( event ) {
		this.event = event;
		this.method = 'on' + event;
		this.deprecate = deprecations[ event ];
	};

	Hook.prototype.call = function call ( method, ractive, arg ) {
		if ( ractive[ method ] ) {
			arg ? ractive[ method ]( arg ) : ractive[ method ]();
			return true;
		}
	};

	Hook.prototype.fire = function fire ( ractive, arg ) {
		this.call( this.method, ractive, arg );

		// handle deprecations
		if ( !ractive[ this.method ] && this.deprecate && this.call( this.deprecate.deprecated, ractive, arg ) ) {
			if ( this.deprecate.message ) {
				warnIfDebug( this.deprecate.message );
			} else {
				warnIfDebug( 'The method "%s" has been deprecated in favor of "%s" and will likely be removed in a future release. See http://docs.ractivejs.org/latest/migrating for more information.', this.deprecate.deprecated, this.deprecate.replacement );
			}
		}

		// TODO should probably use internal method, in case ractive.fire was overwritten
		arg ? ractive.fire( this.event, arg ) : ractive.fire( this.event );
	};

	function addToArray ( array, value ) {
		var index = array.indexOf( value );

		if ( index === -1 ) {
			array.push( value );
		}
	}

	function arrayContains ( array, value ) {
		for ( var i = 0, c = array.length; i < c; i++ ) {
			if ( array[i] == value ) {
				return true;
			}
		}

		return false;
	}

	function arrayContentsMatch ( a, b ) {
		var i;

		if ( !isArray( a ) || !isArray( b ) ) {
			return false;
		}

		if ( a.length !== b.length ) {
			return false;
		}

		i = a.length;
		while ( i-- ) {
			if ( a[i] !== b[i] ) {
				return false;
			}
		}

		return true;
	}

	function ensureArray ( x ) {
		if ( typeof x === 'string' ) {
			return [ x ];
		}

		if ( x === undefined ) {
			return [];
		}

		return x;
	}

	function lastItem ( array ) {
		return array[ array.length - 1 ];
	}

	function removeFromArray ( array, member ) {
		if ( !array ) {
			return;
		}

		var index = array.indexOf( member );

		if ( index !== -1 ) {
			array.splice( index, 1 );
		}
	}

	function toArray ( arrayLike ) {
		var array = [], i = arrayLike.length;
		while ( i-- ) {
			array[i] = arrayLike[i];
		}

		return array;
	}

	var _Promise;
	var PENDING = {};
	var FULFILLED = {};
	var REJECTED = {};
	if ( typeof Promise === 'function' ) {
		// use native Promise
		_Promise = Promise;
	} else {
		_Promise = function ( callback ) {
			var fulfilledHandlers = [],
				rejectedHandlers = [],
				state = PENDING,

				result,
				dispatchHandlers,
				makeResolver,
				fulfil,
				reject,

				promise;

			makeResolver = function ( newState ) {
				return function ( value ) {
					if ( state !== PENDING ) {
						return;
					}

					result = value;
					state = newState;

					dispatchHandlers = makeDispatcher( ( state === FULFILLED ? fulfilledHandlers : rejectedHandlers ), result );

					// dispatch onFulfilled and onRejected handlers asynchronously
					wait( dispatchHandlers );
				};
			};

			fulfil = makeResolver( FULFILLED );
			reject = makeResolver( REJECTED );

			try {
				callback( fulfil, reject );
			} catch ( err ) {
				reject( err );
			}

			promise = {
				// `then()` returns a Promise - 2.2.7
				then: function ( onFulfilled, onRejected ) {
					var promise2 = new _Promise( function ( fulfil, reject ) {

						var processResolutionHandler = function ( handler, handlers, forward ) {

							// 2.2.1.1
							if ( typeof handler === 'function' ) {
								handlers.push( function ( p1result ) {
									var x;

									try {
										x = handler( p1result );
										resolve( promise2, x, fulfil, reject );
									} catch ( err ) {
										reject( err );
									}
								});
							} else {
								// Forward the result of promise1 to promise2, if resolution handlers
								// are not given
								handlers.push( forward );
							}
						};

						// 2.2
						processResolutionHandler( onFulfilled, fulfilledHandlers, fulfil );
						processResolutionHandler( onRejected, rejectedHandlers, reject );

						if ( state !== PENDING ) {
							// If the promise has resolved already, dispatch the appropriate handlers asynchronously
							wait( dispatchHandlers );
						}

					});

					return promise2;
				}
			};

			promise[ 'catch' ] = function ( onRejected ) {
				return this.then( null, onRejected );
			};

			return promise;
		};

		_Promise.all = function ( promises ) {
			return new _Promise( function ( fulfil, reject ) {
				var result = [], pending, i, processPromise;

				if ( !promises.length ) {
					fulfil( result );
					return;
				}

				processPromise = function ( promise, i ) {
					if ( promise && typeof promise.then === 'function' ) {
						promise.then( function ( value ) {
							result[i] = value;
							--pending || fulfil( result );
						}, reject );
					}

					else {
						result[i] = promise;
						--pending || fulfil( result );
					}
				};

				pending = i = promises.length;
				while ( i-- ) {
					processPromise( promises[i], i );
				}
			});
		};

		_Promise.resolve = function ( value ) {
			return new _Promise( function ( fulfil ) {
				fulfil( value );
			});
		};

		_Promise.reject = function ( reason ) {
			return new _Promise( function ( fulfil, reject ) {
				reject( reason );
			});
		};
	}

	var Promise$1 = _Promise;

	// TODO use MutationObservers or something to simulate setImmediate
	function wait ( callback ) {
		setTimeout( callback, 0 );
	}

	function makeDispatcher ( handlers, result ) {
		return function () {
			var handler;

			while ( handler = handlers.shift() ) {
				handler( result );
			}
		};
	}

	function resolve ( promise, x, fulfil, reject ) {
		// Promise Resolution Procedure
		var then;

		// 2.3.1
		if ( x === promise ) {
			throw new TypeError( 'A promise\'s fulfillment handler cannot return the same promise' );
		}

		// 2.3.2
		if ( x instanceof _Promise ) {
			x.then( fulfil, reject );
		}

		// 2.3.3
		else if ( x && ( typeof x === 'object' || typeof x === 'function' ) ) {
			try {
				then = x.then; // 2.3.3.1
			} catch ( e ) {
				reject( e ); // 2.3.3.2
				return;
			}

			// 2.3.3.3
			if ( typeof then === 'function' ) {
				var called, resolvePromise, rejectPromise;

				resolvePromise = function ( y ) {
					if ( called ) {
						return;
					}
					called = true;
					resolve( promise, y, fulfil, reject );
				};

				rejectPromise = function ( r ) {
					if ( called ) {
						return;
					}
					called = true;
					reject( r );
				};

				try {
					then.call( x, resolvePromise, rejectPromise );
				} catch ( e ) {
					if ( !called ) { // 2.3.3.3.4.1
						reject( e ); // 2.3.3.3.4.2
						called = true;
						return;
					}
				}
			}

			else {
				fulfil( x );
			}
		}

		else {
			fulfil( x );
		}
	}

	var TransitionManager = function TransitionManager ( callback, parent ) {
		this.callback = callback;
		this.parent = parent;

		this.intros = [];
		this.outros = [];

		this.children = [];
		this.totalChildren = this.outroChildren = 0;

		this.detachQueue = [];
		this.outrosComplete = false;

		if ( parent ) {
			parent.addChild( this );
		}
	};

	TransitionManager.prototype.add = function add ( transition ) {
		var list = transition.isIntro ? this.intros : this.outros;
		list.push( transition );
	};

	TransitionManager.prototype.addChild = function addChild ( child ) {
		this.children.push( child );

		this.totalChildren += 1;
		this.outroChildren += 1;
	};

	TransitionManager.prototype.decrementOutros = function decrementOutros () {
		this.outroChildren -= 1;
		check( this );
	};

	TransitionManager.prototype.decrementTotal = function decrementTotal () {
		this.totalChildren -= 1;
		check( this );
	};

	TransitionManager.prototype.detachNodes = function detachNodes () {
		this.detachQueue.forEach( detach );
		this.children.forEach( _detachNodes );
	};

	TransitionManager.prototype.ready = function ready () {
		detachImmediate( this );
	};

	TransitionManager.prototype.remove = function remove ( transition ) {
		var list = transition.isIntro ? this.intros : this.outros;
		removeFromArray( list, transition );
		check( this );
	};

	TransitionManager.prototype.start = function start () {
		this.children.forEach( function ( c ) { return c.start(); } );
		this.intros.concat( this.outros ).forEach( function ( t ) { return t.start(); } );
		this.ready = true;
		check( this );
	};

	function detach ( element ) {
		element.detach();
	}

	function _detachNodes ( tm ) { // _ to avoid transpiler quirk
		tm.detachNodes();
	}

	function check ( tm ) {
		if ( !tm.ready || tm.outros.length || tm.outroChildren ) return;

		// If all outros are complete, and we haven't already done this,
		// we notify the parent if there is one, otherwise
		// start detaching nodes
		if ( !tm.outrosComplete ) {
			tm.outrosComplete = true;

			if ( tm.parent && !tm.parent.outrosComplete ) {
				tm.parent.decrementOutros( tm );
			} else {
				tm.detachNodes();
			}
		}

		// Once everything is done, we can notify parent transition
		// manager and call the callback
		if ( !tm.intros.length && !tm.totalChildren ) {
			if ( typeof tm.callback === 'function' ) {
				tm.callback();
			}

			if ( tm.parent && !tm.notifiedTotal ) {
				tm.notifiedTotal = true;
				tm.parent.decrementTotal();
			}
		}
	}

	// check through the detach queue to see if a node is up or downstream from a
	// transition and if not, go ahead and detach it
	function detachImmediate ( manager ) {
		var queue = manager.detachQueue;
		var outros = collectAllOutros( manager );

		var i = queue.length, j = 0, node, trans;
		start: while ( i-- ) {
			node = queue[i].node;
			j = outros.length;
			while ( j-- ) {
				trans = outros[j].element.node;
				// check to see if the node is, contains, or is contained by the transitioning node
				if ( trans === node || trans.contains( node ) || node.contains( trans ) ) continue start;
			}

			// no match, we can drop it
			queue[i].detach();
			queue.splice( i, 1 );
		}
	}

	function collectAllOutros ( manager, list ) {
		if ( !list ) {
			list = [];
			var parent = manager;
			while ( parent.parent ) parent = parent.parent;
			return collectAllOutros( parent, list );
		} else {
			var i = manager.children.length;
			while ( i-- ) {
				list = collectAllOutros( manager.children[i], list );
			}
			list = list.concat( manager.outros );
			return list;
		}
	}

	var changeHook = new Hook( 'change' );

	var batch;

	var runloop = {
		start: function ( instance, returnPromise ) {
			var promise, fulfilPromise;

			if ( returnPromise ) {
				promise = new Promise$1( function ( f ) { return ( fulfilPromise = f ); } );
			}

			batch = {
				previousBatch: batch,
				transitionManager: new TransitionManager( fulfilPromise, batch && batch.transitionManager ),
				fragments: [],
				tasks: [],
				immediateObservers: [],
				deferredObservers: [],
				ractives: [],
				instance: instance
			};

			return promise;
		},

		end: function () {
			flushChanges();

			if ( !batch.previousBatch ) batch.transitionManager.start();

			batch = batch.previousBatch;
		},

		addFragment: function ( fragment ) {
			addToArray( batch.fragments, fragment );
		},

		// TODO: come up with a better way to handle fragments that trigger their own update
		addFragmentToRoot: function ( fragment ) {
			if ( !batch ) return;

			var b = batch;
			while ( b.previousBatch ) {
				b = b.previousBatch;
			}

			addToArray( b.fragments, fragment );
		},

		addInstance: function ( instance ) {
			if ( batch ) addToArray( batch.ractives, instance );
		},

		addObserver: function ( observer, defer ) {
			addToArray( defer ? batch.deferredObservers : batch.immediateObservers, observer );
		},

		registerTransition: function ( transition ) {
			transition._manager = batch.transitionManager;
			batch.transitionManager.add( transition );
		},

		// synchronise node detachments with transition ends
		detachWhenReady: function ( thing ) {
			batch.transitionManager.detachQueue.push( thing );
		},

		scheduleTask: function ( task, postRender ) {
			var _batch;

			if ( !batch ) {
				task();
			} else {
				_batch = batch;
				while ( postRender && _batch.previousBatch ) {
					// this can't happen until the DOM has been fully updated
					// otherwise in some situations (with components inside elements)
					// transitions and decorators will initialise prematurely
					_batch = _batch.previousBatch;
				}

				_batch.tasks.push( task );
			}
		}
	};

	function dispatch ( observer ) {
		observer.dispatch();
	}

	function flushChanges () {
		var which = batch.immediateObservers;
		batch.immediateObservers = [];
		which.forEach( dispatch );

		// Now that changes have been fully propagated, we can update the DOM
		// and complete other tasks
		var i = batch.fragments.length;
		var fragment;

		which = batch.fragments;
		batch.fragments = [];
		var ractives = batch.ractives;
		batch.ractives = [];

		while ( i-- ) {
			fragment = which[i];

			// TODO deprecate this. It's annoying and serves no useful function
			var ractive = fragment.ractive;
			if ( Object.keys( ractive.viewmodel.changes ).length ) {
				changeHook.fire( ractive, ractive.viewmodel.changes );
			}
			ractive.viewmodel.changes = {};
			removeFromArray( ractives, ractive );

			fragment.update();
		}

		i = ractives.length;
		while ( i-- ) {
			var ractive$1 = ractives[i];
			changeHook.fire( ractive$1, ractive$1.viewmodel.changes );
			ractive$1.viewmodel.changes = {};
		}

		batch.transitionManager.ready();

		which = batch.deferredObservers;
		batch.deferredObservers = [];
		which.forEach( dispatch );

		var tasks = batch.tasks;
		batch.tasks = [];

		for ( i = 0; i < tasks.length; i += 1 ) {
			tasks[i]();
		}

		// If updating the view caused some model blowback - e.g. a triple
		// containing <option> elements caused the binding on the <select>
		// to update - then we start over
		if ( batch.fragments.length || batch.immediateObservers.length || batch.deferredObservers.length || batch.ractives.length || batch.tasks.length ) return flushChanges();
	}

	var refPattern = /\[\s*(\*|[0-9]|[1-9][0-9]+)\s*\]/g;
	var splitPattern = /([^\\](?:\\\\)*)\./;
	var escapeKeyPattern = /\\|\./g;
	var unescapeKeyPattern = /((?:\\)+)\1|\\(\.)/g;

	function escapeKey ( key ) {
		if ( typeof key === 'string' ) {
			return key.replace( escapeKeyPattern, '\\$&' );
		}

		return key;
	}

	function normalise ( ref ) {
		return ref ? ref.replace( refPattern, '.$1' ) : '';
	}

	function splitKeypathI ( keypath ) {
		var result = [],
			match;

		keypath = normalise( keypath );

		while ( match = splitPattern.exec( keypath ) ) {
			var index = match.index + match[1].length;
			result.push( keypath.substr( 0, index ) );
			keypath = keypath.substr( index + 1 );
		}

		result.push(keypath);

		return result;
	}

	function unescapeKey ( key ) {
		if ( typeof key === 'string' ) {
			return key.replace( unescapeKeyPattern, '$1$2' );
		}

		return key;
	}

	function bind ( fn, context ) {
		if ( !/this/.test( fn.toString() ) ) return fn;

		var bound = fn.bind( context );
		for ( var prop in fn ) bound[ prop ] = fn[ prop ];

		return bound;
	}

	function set ( ractive, pairs ) {
		var promise = runloop.start( ractive, true );

		var i = pairs.length;
		while ( i-- ) {
			var ref = pairs[i], model = ref[0], value = ref[1];
			if ( typeof value === 'function' ) value = bind( value, ractive );
			model.set( value );
		}

		runloop.end();

		return promise;
	}

	var star = /\*/;
	function gather ( ractive, keypath, base ) {
		if ( base === void 0 ) base = ractive.viewmodel;

		if ( star.test( keypath ) ) {
			return base.findMatches( splitKeypathI( keypath ) );
		} else {
			return [ base.joinAll( splitKeypathI( keypath ) ) ];
		}
	}

	function build ( ractive, keypath, value ) {
		var sets = [];

		// set multiple keypaths in one go
		if ( isObject( keypath ) ) {
			var loop = function ( k ) {
				if ( keypath.hasOwnProperty( k ) ) {
					sets.push.apply( sets, gather( ractive, k ).map( function ( m ) { return [ m, keypath[k] ]; } ) );
				}
			};

			for ( var k in keypath ) loop( k );

		}
		// set a single keypath
		else {
			sets.push.apply( sets, gather( ractive, keypath ).map( function ( m ) { return [ m, value ]; } ) );
		}

		return sets;
	}

	var errorMessage = 'Cannot add to a non-numeric value';

	function add ( ractive, keypath, d ) {
		if ( typeof keypath !== 'string' || !isNumeric( d ) ) {
			throw new Error( 'Bad arguments' );
		}

		var sets = build( ractive, keypath, d );

		return set( ractive, sets.map( function ( pair ) {
			var model = pair[0], add = pair[1], value = model.get();
			if ( !isNumeric( add ) || !isNumeric( value ) ) throw new Error( errorMessage );
			return [ model, value + add ];
		}));
	}

	function Ractive$add ( keypath, d ) {
		return add( this, keypath, ( d === undefined ? 1 : +d ) );
	}

	var noAnimation = Promise$1.resolve();
	defineProperty( noAnimation, 'stop', { value: noop });

	var linear = easing.linear;

	function getOptions ( options, instance ) {
		options = options || {};

		var easing;
		if ( options.easing ) {
			easing = typeof options.easing === 'function' ?
				options.easing :
				instance.easing[ options.easing ];
		}

		return {
			easing: easing || linear,
			duration: 'duration' in options ? options.duration : 400,
			complete: options.complete || noop,
			step: options.step || noop
		};
	}

	function protoAnimate ( ractive, model, to, options ) {
		options = getOptions( options, ractive );
		var from = model.get();

		// don't bother animating values that stay the same
		if ( isEqual( from, to ) ) {
			options.complete( options.to );
			return noAnimation; // TODO should this have .then and .catch methods?
		}

		var interpolator = interpolate( from, to, ractive, options.interpolator );

		// if we can't interpolate the value, set it immediately
		if ( !interpolator ) {
			runloop.start();
			model.set( to );
			runloop.end();

			return noAnimation;
		}

		return model.animate( from, to, options, interpolator );
	}

	function Ractive$animate ( keypath, to, options ) {
		if ( typeof keypath === 'object' ) {
			var keys = Object.keys( keypath );

			throw new Error( ("ractive.animate(...) no longer supports objects. Instead of ractive.animate({\n  " + (keys.map( function ( key ) { return ("'" + key + "': " + (keypath[ key ])); } ).join( '\n  ' )) + "\n}, {...}), do\n\n" + (keys.map( function ( key ) { return ("ractive.animate('" + key + "', " + (keypath[ key ]) + ", {...});"); } ).join( '\n' )) + "\n") );
		}


		return protoAnimate( this, this.viewmodel.joinAll( splitKeypathI( keypath ) ), to, options );
	}

	var detachHook = new Hook( 'detach' );

	function Ractive$detach () {
		if ( this.isDetached ) {
			return this.el;
		}

		if ( this.el ) {
			removeFromArray( this.el.__ractive_instances__, this );
		}

		this.el = this.fragment.detach();
		this.isDetached = true;

		detachHook.fire( this );
		return this.el;
	}

	function Ractive$find ( selector ) {
		if ( !this.el ) throw new Error( ("Cannot call ractive.find('" + selector + "') unless instance is rendered to the DOM") );

		return this.fragment.find( selector );
	}

	function sortByDocumentPosition ( node, otherNode ) {
		if ( node.compareDocumentPosition ) {
			var bitmask = node.compareDocumentPosition( otherNode );
			return ( bitmask & 2 ) ? 1 : -1;
		}

		// In old IE, we can piggy back on the mechanism for
		// comparing component positions
		return sortByItemPosition( node, otherNode );
	}

	function sortByItemPosition ( a, b ) {
		var ancestryA = getAncestry( a.component || a._ractive.proxy );
		var ancestryB = getAncestry( b.component || b._ractive.proxy );

		var oldestA = lastItem( ancestryA );
		var oldestB = lastItem( ancestryB );
		var mutualAncestor;

		// remove items from the end of both ancestries as long as they are identical
		// - the final one removed is the closest mutual ancestor
		while ( oldestA && ( oldestA === oldestB ) ) {
			ancestryA.pop();
			ancestryB.pop();

			mutualAncestor = oldestA;

			oldestA = lastItem( ancestryA );
			oldestB = lastItem( ancestryB );
		}

		// now that we have the mutual ancestor, we can find which is earliest
		oldestA = oldestA.component || oldestA;
		oldestB = oldestB.component || oldestB;

		var fragmentA = oldestA.parentFragment;
		var fragmentB = oldestB.parentFragment;

		// if both items share a parent fragment, our job is easy
		if ( fragmentA === fragmentB ) {
			var indexA = fragmentA.items.indexOf( oldestA );
			var indexB = fragmentB.items.indexOf( oldestB );

			// if it's the same index, it means one contains the other,
			// so we see which has the longest ancestry
			return ( indexA - indexB ) || ancestryA.length - ancestryB.length;
		}

		// if mutual ancestor is a section, we first test to see which section
		// fragment comes first
		var fragments = mutualAncestor.iterations;
		if ( fragments ) {
			var indexA$1 = fragments.indexOf( fragmentA );
			var indexB$1 = fragments.indexOf( fragmentB );

			return ( indexA$1 - indexB$1 ) || ancestryA.length - ancestryB.length;
		}

		throw new Error( 'An unexpected condition was met while comparing the position of two components. Please file an issue at https://github.com/ractivejs/ractive/issues - thanks!' );
	}

	function getParent ( item ) {
		var parentFragment = item.parentFragment;

		if ( parentFragment ) return parentFragment.owner;

		if ( item.component && ( parentFragment = item.component.parentFragment ) ) {
			return parentFragment.owner;
		}
	}

	function getAncestry ( item ) {
		var ancestry = [ item ];
		var ancestor = getParent( item );

		while ( ancestor ) {
			ancestry.push( ancestor );
			ancestor = getParent( ancestor );
		}

		return ancestry;
	}


	var Query = function Query ( ractive, selector, live, isComponentQuery ) {
		this.ractive = ractive;
		this.selector = selector;
		this.live = live;
		this.isComponentQuery = isComponentQuery;

		this.result = [];

		this.dirty = true;
	};

	Query.prototype.add = function add ( item ) {
		this.result.push( item );
		this.makeDirty();
	};

	Query.prototype.cancel = function cancel () {
		var liveQueries = this._root[ this.isComponentQuery ? 'liveComponentQueries' : 'liveQueries' ];
		var selector = this.selector;

		var index = liveQueries.indexOf( selector );

		if ( index !== -1 ) {
			liveQueries.splice( index, 1 );
			liveQueries[ selector ] = null;
		}
	};

	Query.prototype.init = function init () {
		this.dirty = false;
	};

	Query.prototype.makeDirty = function makeDirty () {
		var this$1 = this;

			if ( !this.dirty ) {
			this.dirty = true;

			// Once the DOM has been updated, ensure the query
			// is correctly ordered
			runloop.scheduleTask( function () { return this$1.update(); } );
		}
	};

	Query.prototype.remove = function remove ( nodeOrComponent ) {
		var index = this.result.indexOf( this.isComponentQuery ? nodeOrComponent.instance : nodeOrComponent );
		if ( index !== -1 ) this.result.splice( index, 1 );
	};

	Query.prototype.update = function update () {
		this.result.sort( this.isComponentQuery ? sortByItemPosition : sortByDocumentPosition );
		this.dirty = false;
	};

	Query.prototype.test = function test ( item ) {
		return this.isComponentQuery ?
			( !this.selector || item.name === this.selector ) :
			( item ? matches( item, this.selector ) : null );
	};

	function Ractive$findAll ( selector, options ) {
		if ( !this.el ) throw new Error( ("Cannot call ractive.findAll('" + selector + "', ...) unless instance is rendered to the DOM") );

		options = options || {};
		var liveQueries = this._liveQueries;

		// Shortcut: if we're maintaining a live query with this
		// selector, we don't need to traverse the parallel DOM
		var query = liveQueries[ selector ];
		if ( query ) {
			// Either return the exact same query, or (if not live) a snapshot
			return ( options && options.live ) ? query : query.slice();
		}

		query = new Query( this, selector, !!options.live, false );

		// Add this to the list of live queries Ractive needs to maintain,
		// if applicable
		if ( query.live ) {
			liveQueries.push( selector );
			liveQueries[ '_' + selector ] = query;
		}

		this.fragment.findAll( selector, query );

		query.init();
		return query.result;
	}

	function Ractive$findAllComponents ( selector, options ) {
		options = options || {};
		var liveQueries = this._liveComponentQueries;

		// Shortcut: if we're maintaining a live query with this
		// selector, we don't need to traverse the parallel DOM
		var query = liveQueries[ selector ];
		if ( query ) {
			// Either return the exact same query, or (if not live) a snapshot
			return ( options && options.live ) ? query : query.slice();
		}

		query = new Query( this, selector, !!options.live, true );

		// Add this to the list of live queries Ractive needs to maintain,
		// if applicable
		if ( query.live ) {
			liveQueries.push( selector );
			liveQueries[ '_' + selector ] = query;
		}

		this.fragment.findAllComponents( selector, query );

		query.init();
		return query.result;
	}

	function Ractive$findComponent ( selector ) {
		return this.fragment.findComponent( selector );
	}

	function Ractive$findContainer ( selector ) {
		if ( this.container ) {
			if ( this.container.component && this.container.component.name === selector ) {
				return this.container;
			} else {
				return this.container.findContainer( selector );
			}
		}

		return null;
	}

	function Ractive$findParent ( selector ) {

		if ( this.parent ) {
			if ( this.parent.component && this.parent.component.name === selector ) {
				return this.parent;
			} else {
				return this.parent.findParent ( selector );
			}
		}

		return null;
	}

	function enqueue ( ractive, event ) {
		if ( ractive.event ) {
			ractive._eventQueue.push( ractive.event );
		}

		ractive.event = event;
	}

	function dequeue ( ractive ) {
		if ( ractive._eventQueue.length ) {
			ractive.event = ractive._eventQueue.pop();
		} else {
			ractive.event = null;
		}
	}

	var starMaps = {};

	// This function takes a keypath such as 'foo.bar.baz', and returns
	// all the variants of that keypath that include a wildcard in place
	// of a key, such as 'foo.bar.*', 'foo.*.baz', 'foo.*.*' and so on.
	// These are then checked against the dependants map (ractive.viewmodel.depsMap)
	// to see if any pattern observers are downstream of one or more of
	// these wildcard keypaths (e.g. 'foo.bar.*.status')
	function getPotentialWildcardMatches ( keypath ) {
		var keys, starMap, mapper, i, result, wildcardKeypath;

		keys = splitKeypathI( keypath );
		if( !( starMap = starMaps[ keys.length ]) ) {
			starMap = getStarMap( keys.length );
		}

		result = [];

		mapper = function ( star, i ) {
			return star ? '*' : keys[i];
		};

		i = starMap.length;
		while ( i-- ) {
			wildcardKeypath = starMap[i].map( mapper ).join( '.' );

			if ( !result.hasOwnProperty( wildcardKeypath ) ) {
				result.push( wildcardKeypath );
				result[ wildcardKeypath ] = true;
			}
		}

		return result;
	}

	// This function returns all the possible true/false combinations for
	// a given number - e.g. for two, the possible combinations are
	// [ true, true ], [ true, false ], [ false, true ], [ false, false ].
	// It does so by getting all the binary values between 0 and e.g. 11
	function getStarMap ( num ) {
		var ones = '', max, binary, starMap, mapper, i, j, l, map;

		if ( !starMaps[ num ] ) {
			starMap = [];

			while ( ones.length < num ) {
				ones += 1;
			}

			max = parseInt( ones, 2 );

			mapper = function ( digit ) {
				return digit === '1';
			};

			for ( i = 0; i <= max; i += 1 ) {
				binary = i.toString( 2 );
				while ( binary.length < num ) {
					binary = '0' + binary;
				}

				map = [];
				l = binary.length;
				for (j = 0; j < l; j++) {
					map.push( mapper( binary[j] ) );
				}
				starMap[i] = map;
			}

			starMaps[ num ] = starMap;
		}

		return starMaps[ num ];
	}

	var wildcardCache = {};

	function fireEvent ( ractive, eventName, options ) {
		if ( options === void 0 ) options = {};

		if ( !eventName ) { return; }

		if ( !options.event ) {
			options.event = {
				name: eventName,
				// until event not included as argument default
				_noArg: true
			};
		} else {
			options.event.name = eventName;
		}

		var eventNames = getWildcardNames( eventName );

		return fireEventAs( ractive, eventNames, options.event, options.args, true );
	}

	function getWildcardNames ( eventName ) {
		if ( wildcardCache.hasOwnProperty( eventName ) ) {
			return wildcardCache[ eventName ];
		} else {
			return wildcardCache[ eventName ] = getPotentialWildcardMatches( eventName );
		}
	}

	function fireEventAs  ( ractive, eventNames, event, args, initialFire ) {

		if ( initialFire === void 0 ) initialFire = false;

		var subscribers, i, bubble = true;

		enqueue( ractive, event );

		for ( i = eventNames.length; i >= 0; i-- ) {
			subscribers = ractive._subs[ eventNames[ i ] ];

			if ( subscribers ) {
				bubble = notifySubscribers( ractive, subscribers, event, args ) && bubble;
			}
		}

		dequeue( ractive );

		if ( ractive.parent && bubble ) {

			if ( initialFire && ractive.component ) {
				var fullName = ractive.component.name + '.' + eventNames[ eventNames.length-1 ];
				eventNames = getWildcardNames( fullName );

				if( event && !event.component ) {
					event.component = ractive;
				}
			}

			bubble = fireEventAs( ractive.parent, eventNames, event, args );
		}

		return bubble;
	}

	function notifySubscribers ( ractive, subscribers, event, args ) {
		var originalEvent = null, stopEvent = false;

		if ( event && !event._noArg ) {
			args = [ event ].concat( args );
		}

		// subscribers can be modified inflight, e.g. "once" functionality
		// so we need to copy to make sure everyone gets called
		subscribers = subscribers.slice();

		for ( var i = 0, len = subscribers.length; i < len; i += 1 ) {
			if ( !subscribers[ i ].off && subscribers[ i ].apply( ractive, args ) === false ) {
				stopEvent = true;
			}
		}

		if ( event && !event._noArg && stopEvent && ( originalEvent = event.original ) ) {
			originalEvent.preventDefault && originalEvent.preventDefault();
			originalEvent.stopPropagation && originalEvent.stopPropagation();
		}

		return !stopEvent;
	}

	function Ractive$fire ( eventName ) {
		var args = [], len = arguments.length - 1;
		while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

		return fireEvent( this, eventName, { args: args });
	}

	function badReference ( key ) {
		throw new Error( ("An index or key reference (" + key + ") cannot have child properties") );
	}

	function resolveAmbiguousReference ( fragment, ref ) {
		var localViewmodel = fragment.findContext().root;
		var keys = splitKeypathI( ref );
		var key = keys[0];

		var hasContextChain;
		var crossedComponentBoundary;
		var aliases;

		while ( fragment ) {
			// repeated fragments
			if ( fragment.isIteration ) {
				if ( key === fragment.parent.keyRef ) {
					if ( keys.length > 1 ) badReference( key );
					return fragment.context.getKeyModel( fragment.key );
				}

				if ( key === fragment.parent.indexRef ) {
					if ( keys.length > 1 ) badReference( key );
					return fragment.context.getKeyModel( fragment.index );
				}
			}

			// alias node or iteration
			if ( ( ( aliases = fragment.owner.aliases ) || ( aliases = fragment.aliases ) ) && aliases.hasOwnProperty( key ) ) {
				var model = aliases[ key ];

				if ( keys.length === 1 ) return model;
				else if ( typeof model.joinAll === 'function' ) {
					return model.joinAll( keys.slice( 1 ) );
				}
			}

			if ( fragment.context ) {
				// TODO better encapsulate the component check
				if ( !fragment.isRoot || fragment.ractive.component ) hasContextChain = true;

				if ( fragment.context.has( key ) ) {
					if ( crossedComponentBoundary ) {
						return localViewmodel.createLink( key, fragment.context.joinKey( keys.shift() ), key ).joinAll( keys );
					}

					return fragment.context.joinAll( keys );
				}
			}

			if ( fragment.componentParent && !fragment.ractive.isolated ) {
				// ascend through component boundary
				fragment = fragment.componentParent;
				crossedComponentBoundary = true;
			} else {
				fragment = fragment.parent;
			}
		}

		if ( !hasContextChain ) {
			return localViewmodel.joinAll( keys );
		}
	}

	var stack = [];
	var captureGroup;

	function startCapturing () {
		stack.push( captureGroup = [] );
	}

	function stopCapturing () {
		var dependencies = stack.pop();
		captureGroup = stack[ stack.length - 1 ];
		return dependencies;
	}

	function capture ( model ) {
		if ( captureGroup ) {
			captureGroup.push( model );
		}
	}

	var KeyModel = function KeyModel ( key, parent ) {
		this.value = key;
		this.isReadonly = this.isKey = true;
		this.deps = [];
		this.links = [];
		this.parent = parent;
	};

	KeyModel.prototype.get = function get ( shouldCapture ) {
		if ( shouldCapture ) capture( this );
		return unescapeKey( this.value );
	};

	KeyModel.prototype.getKeypath = function getKeypath () {
		return unescapeKey( this.value );
	};

	KeyModel.prototype.rebinding = function rebinding ( next, previous ) {
		var this$1 = this;

			var i = this.deps.length;
		while ( i-- ) this$1.deps[i].rebinding( next, previous, false );

		i = this.links.length;
		while ( i-- ) this$1.links[i].rebinding( next, previous, false );
	};

	KeyModel.prototype.register = function register ( dependant ) {
		this.deps.push( dependant );
	};

	KeyModel.prototype.registerLink = function registerLink ( link ) {
		addToArray( this.links, link );
	};

	KeyModel.prototype.unregister = function unregister ( dependant ) {
		removeFromArray( this.deps, dependant );
	};

	KeyModel.prototype.unregisterLink = function unregisterLink ( link ) {
		removeFromArray( this.links, link );
	};

	function bind$1               ( x ) { x.bind(); }
	function cancel             ( x ) { x.cancel(); }
	function handleChange       ( x ) { x.handleChange(); }
	function mark               ( x ) { x.mark(); }
	function marked             ( x ) { x.marked(); }
	function notifiedUpstream   ( x ) { x.notifiedUpstream(); }
	function render             ( x ) { x.render(); }
	function teardown           ( x ) { x.teardown(); }
	function unbind             ( x ) { x.unbind(); }
	function unrender           ( x ) { x.unrender(); }
	function unrenderAndDestroy ( x ) { x.unrender( true ); }
	function update             ( x ) { x.update(); }
	function toString$1           ( x ) { return x.toString(); }
	function toEscapedString    ( x ) { return x.toString( true ); }

	var KeypathModel = function KeypathModel ( parent, ractive ) {
		this.parent = parent;
		this.ractive = ractive;
		this.value = ractive ? parent.getKeypath( ractive ) : parent.getKeypath();
		this.deps = [];
		this.children = {};
		this.isReadonly = this.isKeypath = true;
	};

	KeypathModel.prototype.get = function get ( shouldCapture ) {
		if ( shouldCapture ) capture( this );
		return this.value;
	};

	KeypathModel.prototype.getChild = function getChild ( ractive ) {
		if ( !( ractive._guid in this.children ) ) {
			var model = new KeypathModel( this.parent, ractive );
			this.children[ ractive._guid ] = model;
			model.owner = this;
		}
		return this.children[ ractive._guid ];
	};

	KeypathModel.prototype.getKeypath = function getKeypath () {
		return this.value;
	};

	KeypathModel.prototype.handleChange = function handleChange$1 () {
		var this$1 = this;

			var keys = Object.keys( this.children );
		var i = keys.length;
		while ( i-- ) {
			this$1.children[ keys[i] ].handleChange();
		}

		this.deps.forEach( handleChange );
	};

	KeypathModel.prototype.rebindChildren = function rebindChildren ( next ) {
		var this$1 = this;

			var keys = Object.keys( this.children );
		var i = keys.length;
		while ( i-- ) {
			var child = this$1.children[keys[i]];
			child.value = next.getKeypath( child.ractive );
			child.handleChange();
		}
	};

	KeypathModel.prototype.rebinding = function rebinding ( next, previous ) {
		var this$1 = this;

			var model = next ? next.getKeypathModel( this.ractive ) : undefined;

		var keys = Object.keys( this.children );
		var i = keys.length;
		while ( i-- ) {
			this$1.children[ keys[i] ].rebinding( next, previous, false );
		}

		i = this.deps.length;
		while ( i-- ) {
			this$1.deps[i].rebinding( model, this$1, false );
		}
	};

	KeypathModel.prototype.register = function register ( dep ) {
		this.deps.push( dep );
	};

	KeypathModel.prototype.removeChild = function removeChild( model ) {
		if ( model.ractive ) delete this.children[ model.ractive._guid ];
	};

	KeypathModel.prototype.teardown = function teardown () {
		var this$1 = this;

			if ( this.owner ) this.owner.removeChild( this );

		var keys = Object.keys( this.children );
		var i = keys.length;
		while ( i-- ) {
			this$1.children[ keys[i] ].teardown();
		}
	};

	KeypathModel.prototype.unregister = function unregister ( dep ) {
		removeFromArray( this.deps, dep );
		if ( !this.deps.length ) this.teardown();
	};

	var hasProp = Object.prototype.hasOwnProperty;

	var shuffleTasks = { early: [], mark: [] };
	var registerQueue = { early: [], mark: [] };

	var ModelBase = function ModelBase ( parent ) {
		this.deps = [];

		this.children = [];
		this.childByKey = {};
		this.links = [];

		this.keyModels = {};

		this.unresolved = [];
		this.unresolvedByKey = {};

		this.bindings = [];
		this.patternObservers = [];

		if ( parent ) {
			this.parent = parent;
			this.root = parent.root;
		}
	};

	ModelBase.prototype.addUnresolved = function addUnresolved ( key, resolver ) {
		if ( !this.unresolvedByKey[ key ] ) {
			this.unresolved.push( key );
			this.unresolvedByKey[ key ] = [];
		}

		this.unresolvedByKey[ key ].push( resolver );
	};

	ModelBase.prototype.addShuffleTask = function addShuffleTask ( task, stage ) { if ( stage === void 0 ) stage = 'early';

		shuffleTasks[stage].push( task ); };
	ModelBase.prototype.addShuffleRegister = function addShuffleRegister ( item, stage ) { if ( stage === void 0 ) stage = 'early';

		registerQueue[stage].push({ model: this, item: item }); };

	ModelBase.prototype.clearUnresolveds = function clearUnresolveds ( specificKey ) {
		var this$1 = this;

			var i = this.unresolved.length;

		while ( i-- ) {
			var key = this$1.unresolved[i];

			if ( specificKey && key !== specificKey ) continue;

			var resolvers = this$1.unresolvedByKey[ key ];
			var hasKey = this$1.has( key );

			var j = resolvers.length;
			while ( j-- ) {
				if ( hasKey ) resolvers[j].attemptResolution();
				if ( resolvers[j].resolved ) resolvers.splice( j, 1 );
			}

			if ( !resolvers.length ) {
				this$1.unresolved.splice( i, 1 );
				this$1.unresolvedByKey[ key ] = null;
			}
		}
	};

	ModelBase.prototype.findMatches = function findMatches ( keys ) {
		var len = keys.length;

		var existingMatches = [ this ];
		var matches;
		var i;

		var loop = function (  ) {
			var key = keys[i];

			if ( key === '*' ) {
				matches = [];
				existingMatches.forEach( function ( model ) {
					matches.push.apply( matches, model.getValueChildren( model.get() ) );
				});
			} else {
				matches = existingMatches.map( function ( model ) { return model.joinKey( key ); } );
			}

			existingMatches = matches;
		};

			for ( i = 0; i < len; i += 1 ) loop(  );

		return matches;
	};

	ModelBase.prototype.getKeyModel = function getKeyModel ( key, skip ) {
		if ( key !== undefined && !skip ) return this.parent.getKeyModel( key, true );

		if ( !( key in this.keyModels ) ) this.keyModels[ key ] = new KeyModel( escapeKey( key ), this );

		return this.keyModels[ key ];
	};

	ModelBase.prototype.getKeypath = function getKeypath ( ractive ) {
		if ( ractive !== this.ractive && this._link ) return this._link.target.getKeypath( ractive );

		if ( !this.keypath ) {
			this.keypath = this.parent.isRoot ? this.key : ("" + (this.parent.getKeypath( ractive )) + "." + (escapeKey( this.key )));
		}

		return this.keypath;
	};

	ModelBase.prototype.getValueChildren = function getValueChildren ( value ) {
		var this$1 = this;

			var children;
		if ( isArray( value ) ) {
			children = [];
			if ( 'length' in this && this.length !== value.length ) {
				children.push( this.joinKey( 'length' ) );
			}
			value.forEach( function ( m, i ) {
				children.push( this$1.joinKey( i ) );
			});
		}

		else if ( isObject( value ) || typeof value === 'function' ) {
			children = Object.keys( value ).map( function ( key ) { return this$1.joinKey( key ); } );
		}

		else if ( value != null ) {
			return [];
		}

		return children;
	};

	ModelBase.prototype.getVirtual = function getVirtual ( shouldCapture ) {
		var this$1 = this;

			var value = this.get( shouldCapture, { virtual: false } );
		if ( isObject( value ) ) {
			var result = isArray( value ) ? [] : {};

			var keys = Object.keys( value );
			var i = keys.length;
			while ( i-- ) {
				var child = this$1.childByKey[ keys[i] ];
				if ( !child ) result[ keys[i] ] = value[ keys[i] ];
				else if ( child._link ) result[ keys[i] ] = child._link.getVirtual();
				else result[ keys[i] ] = child.getVirtual();
			}

			i = this.children.length;
			while ( i-- ) {
				var child$1 = this$1.children[i];
				if ( !( child$1.key in result ) && child$1._link ) {
					result[ child$1.key ] = child$1._link.getVirtual();
				}
			}

			return result;
		} else return value;
	};

	ModelBase.prototype.has = function has ( key ) {
		if ( this._link ) return this._link.has( key );

		var value = this.get();
		if ( !value ) return false;

		key = unescapeKey( key );
		if ( hasProp.call( value, key ) ) return true;

		// We climb up the constructor chain to find if one of them contains the key
		var constructor = value.constructor;
		while ( constructor !== Function && constructor !== Array && constructor !== Object ) {
			if ( hasProp.call( constructor.prototype, key ) ) return true;
			constructor = constructor.constructor;
		}

		return false;
	};

	ModelBase.prototype.joinAll = function joinAll ( keys, opts ) {
		var model = this;
		for ( var i = 0; i < keys.length; i += 1 ) {
			if ( opts && opts.lastLink === false && i + 1 === keys.length && model.childByKey[keys[i]] && model.childByKey[keys[i]]._link ) return model.childByKey[keys[i]];
			model = model.joinKey( keys[i], opts );
		}

		return model;
	};

	ModelBase.prototype.notifyUpstream = function notifyUpstream () {
		var parent = this.parent, path = [ this.key ];
		while ( parent ) {
			if ( parent.patternObservers.length ) parent.patternObservers.forEach( function ( o ) { return o.notify( path.slice() ); } );
			path.unshift( parent.key );
			parent.links.forEach( notifiedUpstream );
			parent.deps.forEach( handleChange );
			parent = parent.parent;
		}
	};

	ModelBase.prototype.rebinding = function rebinding ( next, previous, safe ) {
		// tell the deps to move to the new target
		var this$1 = this;

			var i = this.deps.length;
		while ( i-- ) {
			if ( this$1.deps[i].rebinding ) this$1.deps[i].rebinding( next, previous, safe );
		}

		i = this.links.length;
		while ( i-- ) {
			var link = this$1.links[i];
			// only relink the root of the link tree
			if ( link.owner._link ) link.relinking( next, true, safe );
		}

		i = this.children.length;
		while ( i-- ) {
			var child = this$1.children[i];
			child.rebinding( next ? next.joinKey( child.key ) : undefined, child, safe );
		}

		i = this.unresolved.length;
		while ( i-- ) {
			var unresolved = this$1.unresolvedByKey[ this$1.unresolved[i] ];
			var c = unresolved.length;
			while ( c-- ) {
				unresolved[c].rebinding( next, previous );
			}
		}

		if ( this.keypathModel ) this.keypathModel.rebinding( next, previous, false );

		i = this.bindings.length;
		while ( i-- ) {
			this$1.bindings[i].rebinding( next, previous, safe );
		}
	};

	ModelBase.prototype.register = function register ( dep ) {
		this.deps.push( dep );
	};

	ModelBase.prototype.registerChange = function registerChange ( key, value ) {
		if ( !this.isRoot ) {
			this.root.registerChange( key, value );
		} else {
			this.changes[ key ] = value;
			runloop.addInstance( this.root.ractive );
		}
	};

	ModelBase.prototype.registerLink = function registerLink ( link ) {
		addToArray( this.links, link );
	};

	ModelBase.prototype.registerPatternObserver = function registerPatternObserver ( observer ) {
		this.patternObservers.push( observer );
		this.register( observer );
	};

	ModelBase.prototype.registerTwowayBinding = function registerTwowayBinding ( binding ) {
		this.bindings.push( binding );
	};

	ModelBase.prototype.removeUnresolved = function removeUnresolved ( key, resolver ) {
		var resolvers = this.unresolvedByKey[ key ];

		if ( resolvers ) {
			removeFromArray( resolvers, resolver );
		}
	};

	ModelBase.prototype.shuffled = function shuffled () {
		var this$1 = this;

			var i = this.children.length;
		while ( i-- ) {
			this$1.children[i].shuffled();
		}
		if ( this.wrapper ) {
			this.wrapper.teardown();
			this.wrapper = null;
			this.rewrap = true;
		}
	};

	ModelBase.prototype.unregister = function unregister ( dependant ) {
		removeFromArray( this.deps, dependant );
	};

	ModelBase.prototype.unregisterLink = function unregisterLink ( link ) {
		removeFromArray( this.links, link );
	};

	ModelBase.prototype.unregisterPatternObserver = function unregisterPatternObserver ( observer ) {
		removeFromArray( this.patternObservers, observer );
		this.unregister( observer );
	};

	ModelBase.prototype.unregisterTwowayBinding = function unregisterTwowayBinding ( binding ) {
		removeFromArray( this.bindings, binding );
	};

	ModelBase.prototype.updateFromBindings = function updateFromBindings$1 ( cascade ) {
		var this$1 = this;

			var i = this.bindings.length;
		while ( i-- ) {
			var value = this$1.bindings[i].getValue();
			if ( value !== this$1.value ) this$1.set( value );
		}

		// check for one-way bindings if there are no two-ways
		if ( !this.bindings.length ) {
			var oneway = findBoundValue( this.deps );
			if ( oneway && oneway.value !== this.value ) this.set( oneway.value );
		}

		if ( cascade ) {
			this.children.forEach( updateFromBindings );
			this.links.forEach( updateFromBindings );
			if ( this._link ) this._link.updateFromBindings( cascade );
		}
	};

	function updateFromBindings ( model ) {
		model.updateFromBindings( true );
	}

	function findBoundValue( list ) {
		var i = list.length;
		while ( i-- ) {
			if ( list[i].bound ) {
				var owner = list[i].owner;
				if ( owner ) {
					var value = owner.name === 'checked' ?
						owner.node.checked :
						owner.node.value;
					return { value: value };
				}
			}
		}
	}

	function fireShuffleTasks ( stage ) {
		if ( !stage ) {
			fireShuffleTasks( 'early' );
			fireShuffleTasks( 'mark' );
		} else {
			var tasks = shuffleTasks[stage];
			shuffleTasks[stage] = [];
			var i = tasks.length;
			while ( i-- ) tasks[i]();

			var register = registerQueue[stage];
			registerQueue[stage] = [];
			i = register.length;
			while ( i-- ) register[i].model.register( register[i].item );
		}
	}

	KeyModel.prototype.addShuffleTask = ModelBase.prototype.addShuffleTask;
	KeyModel.prototype.addShuffleRegister = ModelBase.prototype.addShuffleRegister;
	KeypathModel.prototype.addShuffleTask = ModelBase.prototype.addShuffleTask;
	KeypathModel.prototype.addShuffleRegister = ModelBase.prototype.addShuffleRegister;

	// this is the dry method of checking to see if a rebind applies to
	// a particular keypath because in some cases, a dep may be bound
	// directly to a particular keypath e.g. foo.bars.0.baz and need
	// to avoid getting kicked to foo.bars.1.baz if foo.bars is unshifted
	function rebindMatch ( template, next, previous ) {
		var keypath = template.r || template;

		// no valid keypath, go with next
		if ( !keypath || typeof keypath !== 'string' ) return next;

		// completely contextual ref, go with next
		if ( keypath === '.' || keypath[0] === '@' || (next || previous).isKey || (next || previous).isKeypath ) return next;

		var parts = keypath.split( '/' );
		var keys = splitKeypathI( parts[ parts.length - 1 ] );

		// check the keypath against the model keypath to see if it matches
		var model = next || previous;
		var i = keys.length;
		var match = true, shuffling = false;

		while ( model && i-- ) {
			if ( model.shuffling ) shuffling = true;
			// non-strict comparison to account for indices in keypaths
			if ( keys[i] != model.key ) match = false;
			model = model.parent;
		}

		// next is undefined, but keypath is shuffling and previous matches
		if ( !next && match && shuffling ) return previous;
		// next is defined, but doesn't match the keypath
		else if ( next && !match && shuffling ) return previous;
		else return next;
	}

	var LinkModel = (function (ModelBase) {
		function LinkModel ( parent, owner, target, key ) {
			ModelBase.call( this, parent );

			this.owner = owner;
			this.target = target;
			this.key = key === undefined ? owner.key : key;
			if ( owner.isLink ) this.sourcePath = "" + (owner.sourcePath) + "." + (this.key);

			target.registerLink( this );

			this.isReadonly = parent.isReadonly;

			this.isLink = true;
		}

		LinkModel.prototype = Object.create( ModelBase && ModelBase.prototype );
		LinkModel.prototype.constructor = LinkModel;

		LinkModel.prototype.animate = function animate ( from, to, options, interpolator ) {
			return this.target.animate( from, to, options, interpolator );
		};

		LinkModel.prototype.applyValue = function applyValue ( value ) {
			this.target.applyValue( value );
		};

		LinkModel.prototype.get = function get ( shouldCapture, opts ) {
			if ( shouldCapture ) {
				capture( this );

				// may need to tell the target to unwrap
				opts = opts || {};
				opts.unwrap = true;
			}

			return this.target.get( false, opts );
		};

		LinkModel.prototype.getKeypath = function getKeypath ( ractive ) {
			if ( ractive && ractive !== this.root.ractive ) return this.target.getKeypath( ractive );

			return ModelBase.prototype.getKeypath.call( this, ractive );
		};

		LinkModel.prototype.getKeypathModel = function getKeypathModel ( ractive ) {
			if ( !this.keypathModel ) this.keypathModel = new KeypathModel( this );
			if ( ractive && ractive !== this.root.ractive ) return this.keypathModel.getChild( ractive );
			return this.keypathModel;
		};

		LinkModel.prototype.handleChange = function handleChange$1 () {
			this.deps.forEach( handleChange );
			this.links.forEach( handleChange );
			this.notifyUpstream();
		};

		LinkModel.prototype.joinKey = function joinKey ( key ) {
			// TODO: handle nested links
			if ( key === undefined || key === '' ) return this;

			if ( !this.childByKey.hasOwnProperty( key ) ) {
				var child = new LinkModel( this, this, this.target.joinKey( key ), key );
				this.children.push( child );
				this.childByKey[ key ] = child;
			}

			return this.childByKey[ key ];
		};

		LinkModel.prototype.mark = function mark () {
			this.target.mark();
		};

		LinkModel.prototype.marked = function marked$1 () {
			this.links.forEach( marked );

			this.deps.forEach( handleChange );
			this.clearUnresolveds();
		};

		LinkModel.prototype.notifiedUpstream = function notifiedUpstream$1 () {
			this.links.forEach( notifiedUpstream );
			this.deps.forEach( handleChange );
		};

		LinkModel.prototype.relinked = function relinked () {
			this.target.registerLink( this );
			this.children.forEach( function ( c ) { return c.relinked(); } );
		};

		LinkModel.prototype.relinking = function relinking ( target, root, safe ) {
			var this$1 = this;

			if ( root && this.sourcePath ) target = rebindMatch( this.sourcePath, target, this.target );
			if ( !target || this.target === target ) return;

			this.target.unregisterLink( this );
			if ( this.keypathModel ) this.keypathModel.rebindChildren( target );

			this.target = target;
			this.children.forEach( function ( c ) {
				c.relinking( target.joinKey( c.key ), false, safe );
			});

			if ( root ) this.addShuffleTask( function () {
				this$1.relinked();
				if ( !safe ) this$1.notifyUpstream();
			});
		};

		LinkModel.prototype.set = function set ( value ) {
			this.target.set( value );
		};

		LinkModel.prototype.shuffle = function shuffle ( newIndices ) {
			// watch for extra shuffles caused by a shuffle in a downstream link
			var this$1 = this;

			if ( this.shuffling ) return;

			// let the real model handle firing off shuffles
			if ( !this.target.shuffling ) {
				this.target.shuffle( newIndices );
			} else {
				this.shuffling = true;

				var i = newIndices.length;
				while ( i-- ) {
					var idx = newIndices[ i ];
					// nothing is actually changing, so move in the index and roll on
					if ( i === idx ) {
						continue;
					}

					// rebind the children on i to idx
					if ( i in this$1.childByKey ) this$1.childByKey[ i ].rebinding( !~idx ? undefined : this$1.joinKey( idx ), this$1.childByKey[ i ], true );

					if ( !~idx && this$1.keyModels[ i ] ) {
						this$1.keyModels[i].rebinding( undefined, this$1.keyModels[i], false );
					} else if ( ~idx && this$1.keyModels[ i ] ) {
						if ( !this$1.keyModels[ idx ] ) this$1.childByKey[ idx ].getKeyModel( idx );
						this$1.keyModels[i].rebinding( this$1.keyModels[ idx ], this$1.keyModels[i], false );
					}
				}

				var upstream = this.source().length !== this.source().value.length;

				this.links.forEach( function ( l ) { return l.shuffle( newIndices ); } );

				i = this.deps.length;
				while ( i-- ) {
					if ( this$1.deps[i].shuffle ) this$1.deps[i].shuffle( newIndices );
				}

				this.marked();

				if ( upstream ) this.notifyUpstream();

				this.shuffling = false;
			}

		};

		LinkModel.prototype.source = function source () {
			if ( this.target.source ) return this.target.source();
			else return this.target;
		};

		LinkModel.prototype.teardown = function teardown$1 () {
			if ( this._link ) this._link.teardown();
			this.children.forEach( teardown );
		};

		return LinkModel;
	}(ModelBase));

	ModelBase.prototype.link = function link ( model, keypath ) {
		var lnk = this._link || new LinkModel( this.parent, this, model, this.key );
		lnk.sourcePath = keypath;
		if ( this._link ) this._link.relinking( model, true, false );
		this.rebinding( lnk, this, false );
		fireShuffleTasks();

		var unresolved = !this._link;
		this._link = lnk;
		if ( unresolved ) this.parent.clearUnresolveds();
		lnk.marked();
		return lnk;
	};

	ModelBase.prototype.unlink = function unlink () {
		if ( this._link ) {
			var ln = this._link;
			this._link = undefined;
			ln.rebinding( this, this._link );
			fireShuffleTasks();
			ln.teardown();
		}
	};

	var requestAnimationFrame;

	// If window doesn't exist, we don't need requestAnimationFrame
	if ( !win ) {
		requestAnimationFrame = null;
	} else {
		// https://gist.github.com/paulirish/1579671
		(function(vendors, lastTime, win) {

			var x, setTimeout;

			if ( win.requestAnimationFrame ) {
				return;
			}

			for ( x = 0; x < vendors.length && !win.requestAnimationFrame; ++x ) {
				win.requestAnimationFrame = win[vendors[x]+'RequestAnimationFrame'];
			}

			if ( !win.requestAnimationFrame ) {
				setTimeout = win.setTimeout;

				win.requestAnimationFrame = function(callback) {
					var currTime, timeToCall, id;

					currTime = Date.now();
					timeToCall = Math.max( 0, 16 - (currTime - lastTime ) );
					id = setTimeout( function() { callback(currTime + timeToCall); }, timeToCall );

					lastTime = currTime + timeToCall;
					return id;
				};
			}

		}( vendors, 0, win ));

		requestAnimationFrame = win.requestAnimationFrame;
	}

	var rAF = requestAnimationFrame;

	var getTime = ( win && win.performance && typeof win.performance.now === 'function' ) ?
		function () { return win.performance.now(); } :
		function () { return Date.now(); };

	// TODO what happens if a transition is aborted?

	var tickers = [];
	var running = false;

	function tick () {
		runloop.start();

		var now = getTime();

		var i;
		var ticker;

		for ( i = 0; i < tickers.length; i += 1 ) {
			ticker = tickers[i];

			if ( !ticker.tick( now ) ) {
				// ticker is complete, remove it from the stack, and decrement i so we don't miss one
				tickers.splice( i--, 1 );
			}
		}

		runloop.end();

		if ( tickers.length ) {
			rAF( tick );
		} else {
			running = false;
		}
	}

	var Ticker = function Ticker ( options ) {
		this.duration = options.duration;
		this.step = options.step;
		this.complete = options.complete;
		this.easing = options.easing;

		this.start = getTime();
		this.end = this.start + this.duration;

		this.running = true;

		tickers.push( this );
		if ( !running ) rAF( tick );
	};

	Ticker.prototype.tick = function tick$1 ( now ) {
		if ( !this.running ) return false;

		if ( now > this.end ) {
			if ( this.step ) this.step( 1 );
			if ( this.complete ) this.complete( 1 );

			return false;
		}

		var elapsed = now - this.start;
		var eased = this.easing( elapsed / this.duration );

		if ( this.step ) this.step( eased );

		return true;
	};

	Ticker.prototype.stop = function stop () {
		if ( this.abort ) this.abort();
		this.running = false;
	};

	var prefixers = {};

	// TODO this is legacy. sooner we can replace the old adaptor API the better
	function prefixKeypath ( obj, prefix ) {
		var prefixed = {}, key;

		if ( !prefix ) {
			return obj;
		}

		prefix += '.';

		for ( key in obj ) {
			if ( obj.hasOwnProperty( key ) ) {
				prefixed[ prefix + key ] = obj[ key ];
			}
		}

		return prefixed;
	}

	function getPrefixer ( rootKeypath ) {
		var rootDot;

		if ( !prefixers[ rootKeypath ] ) {
			rootDot = rootKeypath ? rootKeypath + '.' : '';

			prefixers[ rootKeypath ] = function ( relativeKeypath, value ) {
				var obj;

				if ( typeof relativeKeypath === 'string' ) {
					obj = {};
					obj[ rootDot + relativeKeypath ] = value;
					return obj;
				}

				if ( typeof relativeKeypath === 'object' ) {
					// 'relativeKeypath' is in fact a hash, not a keypath
					return rootDot ? prefixKeypath( relativeKeypath, rootKeypath ) : relativeKeypath;
				}
			};
		}

		return prefixers[ rootKeypath ];
	}

	var Model = (function (ModelBase) {
		function Model ( parent, key ) {
			ModelBase.call( this, parent );

			this.ticker = null;

			if ( parent ) {
				this.key = unescapeKey( key );
				this.isReadonly = parent.isReadonly;

				if ( parent.value ) {
					this.value = parent.value[ this.key ];
					if ( isArray( this.value ) ) this.length = this.value.length;
					this.adapt();
				}
			}
		}

		Model.prototype = Object.create( ModelBase && ModelBase.prototype );
		Model.prototype.constructor = Model;

		Model.prototype.adapt = function adapt () {
			var this$1 = this;

			var adaptors = this.root.adaptors;
			var len = adaptors.length;

			this.rewrap = false;

			// Exit early if no adaptors
			if ( len === 0 ) return;

			var value = this.wrapper ? ( 'newWrapperValue' in this ? this.newWrapperValue : this.wrapperValue ) : this.value;

			// TODO remove this legacy nonsense
			var ractive = this.root.ractive;
			var keypath = this.getKeypath();

			// tear previous adaptor down if present
			if ( this.wrapper ) {
				var shouldTeardown = this.wrapperValue === value ? false : !this.wrapper.reset || this.wrapper.reset( value ) === false;

				if ( shouldTeardown ) {
					this.wrapper.teardown();
					this.wrapper = null;

					// don't branch for undefined values
					if ( this.value !== undefined ) {
						var parentValue = this.parent.value || this.parent.createBranch( this.key );
						if ( parentValue[ this.key ] !== value ) parentValue[ this.key ] = value;
					}
				} else {
					delete this.newWrapperValue;
					this.wrapperValue = value;
					this.value = this.wrapper.get();
					return;
				}
			}

			var i;

			for ( i = 0; i < len; i += 1 ) {
				var adaptor = adaptors[i];
				if ( adaptor.filter( value, keypath, ractive ) ) {
					this$1.wrapper = adaptor.wrap( ractive, value, keypath, getPrefixer( keypath ) );
					this$1.wrapperValue = value;
					this$1.wrapper.__model = this$1; // massive temporary hack to enable array adaptor

					this$1.value = this$1.wrapper.get();

					break;
				}
			}
		};

		Model.prototype.animate = function animate ( from, to, options, interpolator ) {
			var this$1 = this;

			if ( this.ticker ) this.ticker.stop();

			var fulfilPromise;
			var promise = new Promise$1( function ( fulfil ) { return fulfilPromise = fulfil; } );

			this.ticker = new Ticker({
				duration: options.duration,
				easing: options.easing,
				step: function ( t ) {
					var value = interpolator( t );
					this$1.applyValue( value );
					if ( options.step ) options.step( t, value );
				},
				complete: function () {
					this$1.applyValue( to );
					if ( options.complete ) options.complete( to );

					this$1.ticker = null;
					fulfilPromise();
				}
			});

			promise.stop = this.ticker.stop;
			return promise;
		};

		Model.prototype.applyValue = function applyValue ( value ) {
			if ( isEqual( value, this.value ) ) return;

			// TODO deprecate this nonsense
			this.registerChange( this.getKeypath(), value );

			if ( this.parent.wrapper && this.parent.wrapper.set ) {
				this.parent.wrapper.set( this.key, value );
				this.parent.value = this.parent.wrapper.get();

				this.value = this.parent.value[ this.key ];
				if ( this.wrapper ) this.newWrapperValue = this.value;
				this.adapt();
			} else if ( this.wrapper ) {
				this.newWrapperValue = value;
				this.adapt();
			} else {
				var parentValue = this.parent.value || this.parent.createBranch( this.key );
				parentValue[ this.key ] = value;

				this.value = value;
				this.adapt();
			}

			this.parent.clearUnresolveds();
			this.clearUnresolveds();

			// keep track of array stuff
			if ( isArray( value ) ) {
				this.length = value.length;
				this.isArray = true;
			} else {
				this.isArray = false;
			}

			// notify dependants
			this.links.forEach( handleChange );
			this.children.forEach( mark );
			this.deps.forEach( handleChange );

			this.notifyUpstream();

			if ( this.parent.isArray ) {
				if ( this.key === 'length' ) this.parent.length = value;
				else this.parent.joinKey( 'length' ).mark();
			}
		};

		Model.prototype.createBranch = function createBranch ( key ) {
			var branch = isNumeric( key ) ? [] : {};
			this.set( branch );

			return branch;
		};

		Model.prototype.get = function get ( shouldCapture, opts ) {
			if ( this._link ) return this._link.get( shouldCapture, opts );
			if ( shouldCapture ) capture( this );
			// if capturing, this value needs to be unwrapped because it's for external use
			if ( opts && opts.virtual ) return this.getVirtual( false );
			return ( shouldCapture || ( opts && opts.unwrap ) ) && this.wrapper ? this.wrapperValue : this.value;
		};

		Model.prototype.getKeypathModel = function getKeypathModel ( ractive ) {
			if ( !this.keypathModel ) this.keypathModel = new KeypathModel( this );
			return this.keypathModel;
		};

		Model.prototype.joinKey = function joinKey ( key, opts ) {
			if ( this._link ) {
				if ( opts && !opts.lastLink === false && ( key === undefined || key === '' ) ) return this;
				return this._link.joinKey( key );
			}

			if ( key === undefined || key === '' ) return this;


			if ( !this.childByKey.hasOwnProperty( key ) ) {
				var child = new Model( this, key );
				this.children.push( child );
				this.childByKey[ key ] = child;
			}

			if ( this.childByKey[ key ]._link ) return this.childByKey[ key ]._link;
			return this.childByKey[ key ];
		};

		Model.prototype.mark = function mark$1 () {
			if ( this._link ) return this._link.mark();

			var value = this.retrieve();

			if ( !isEqual( value, this.value ) ) {
				var old = this.value;
				this.value = value;

				// make sure the wrapper stays in sync
				if ( old !== value || this.rewrap ) {
					if ( this.wrapper ) this.newWrapperValue = value;
					this.adapt();
				}

				// keep track of array stuff
				if ( isArray( value ) ) {
					this.length = value.length;
					this.isArray = true;
				} else {
					this.isArray = false;
				}

				this.children.forEach( mark );
				this.links.forEach( marked );

				this.deps.forEach( handleChange );
				this.clearUnresolveds();
			}
		};

		Model.prototype.merge = function merge ( array, comparator ) {
			var oldArray = this.value, newArray = array;
			if ( oldArray === newArray ) oldArray = recreateArray( this );
			if ( comparator ) {
				oldArray = oldArray.map( comparator );
				newArray = newArray.map( comparator );
			}

			var oldLength = oldArray.length;

			var usedIndices = {};
			var firstUnusedIndex = 0;

			var newIndices = oldArray.map( function ( item ) {
				var index;
				var start = firstUnusedIndex;

				do {
					index = newArray.indexOf( item, start );

					if ( index === -1 ) {
						return -1;
					}

					start = index + 1;
				} while ( ( usedIndices[ index ] === true ) && start < oldLength );

				// keep track of the first unused index, so we don't search
				// the whole of newArray for each item in oldArray unnecessarily
				if ( index === firstUnusedIndex ) {
					firstUnusedIndex += 1;
				}
				// allow next instance of next "equal" to be found item
				usedIndices[ index ] = true;
				return index;
			});

			this.parent.value[ this.key ] = array;
			this.shuffle( newIndices );
		};

		Model.prototype.retrieve = function retrieve () {
			return this.parent.value ? this.parent.value[ this.key ] : undefined;
		};

		Model.prototype.set = function set ( value ) {
			if ( this.ticker ) this.ticker.stop();
			this.applyValue( value );
		};

		Model.prototype.shuffle = function shuffle ( newIndices ) {
			var this$1 = this;

			this.shuffling = true;
			var i = newIndices.length;
			while ( i-- ) {
				var idx = newIndices[ i ];
				// nothing is actually changing, so move in the index and roll on
				if ( i === idx ) {
					continue;
				}

				// rebind the children on i to idx
				if ( i in this$1.childByKey ) this$1.childByKey[ i ].rebinding( !~idx ? undefined : this$1.joinKey( idx ), this$1.childByKey[ i ], true );

				if ( !~idx && this$1.keyModels[ i ] ) {
					this$1.keyModels[i].rebinding( undefined, this$1.keyModels[i], false );
				} else if ( ~idx && this$1.keyModels[ i ] ) {
					if ( !this$1.keyModels[ idx ] ) this$1.childByKey[ idx ].getKeyModel( idx );
					this$1.keyModels[i].rebinding( this$1.keyModels[ idx ], this$1.keyModels[i], false );
				}
			}

			var upstream = this.length !== this.value.length;

			this.links.forEach( function ( l ) { return l.shuffle( newIndices ); } );
			fireShuffleTasks( 'early' );

			i = this.deps.length;
			while ( i-- ) {
				if ( this$1.deps[i].shuffle ) this$1.deps[i].shuffle( newIndices );
			}

			this.mark();
			fireShuffleTasks( 'mark' );

			if ( upstream ) this.notifyUpstream();
			this.shuffling = false;
		};

		Model.prototype.teardown = function teardown$1 () {
			if ( this._link ) this._link.teardown();
			this.children.forEach( teardown );
			if ( this.wrapper ) this.wrapper.teardown();
			if ( this.keypathModel ) this.keypathModel.teardown();
		};

		return Model;
	}(ModelBase));

	function recreateArray( model ) {
		var array = [];

		for ( var i = 0; i < model.length; i++ ) {
			array[ i ] = (model.childByKey[i] || {}).value;
		}

		return array;
	}

	var GlobalModel = (function (Model) {
		function GlobalModel ( ) {
			Model.call( this, null, '@global' );
			this.value = typeof global !== 'undefined' ? global : window;
			this.isRoot = true;
			this.root = this;
			this.adaptors = [];
		}

		GlobalModel.prototype = Object.create( Model && Model.prototype );
		GlobalModel.prototype.constructor = GlobalModel;

		GlobalModel.prototype.getKeypath = function getKeypath() {
			return '@global';
		};

		// global model doesn't contribute changes events because it has no instance
		GlobalModel.prototype.registerChange = function registerChange () {};

		return GlobalModel;
	}(Model));

	var GlobalModel$1 = new GlobalModel();

	var keypathExpr = /^@[^\(]+\(([^\)]+)\)/;

	function resolveReference ( fragment, ref ) {
		var context = fragment.findContext();

		// special references
		// TODO does `this` become `.` at parse time?
		if ( ref === '.' || ref === 'this' ) return context;
		if ( ref.indexOf( '@keypath' ) === 0 ) {
			var match = keypathExpr.exec( ref );
			if ( match && match[1] ) {
				var model = resolveReference( fragment, match[1] );
				if ( model ) return model.getKeypathModel();
			}
			return context.getKeypathModel();
		}
		if ( ref.indexOf( '@rootpath' ) === 0 ) {
			// check to see if this is an empty component root
			while ( context.isRoot && context.ractive.component ) {
				context = context.ractive.component.parentFragment.findContext();
			}

			var match$1 = keypathExpr.exec( ref );
			if ( match$1 && match$1[1] ) {
				var model$1 = resolveReference( fragment, match$1[1] );
				if ( model$1 ) return model$1.getKeypathModel( fragment.ractive.root );
			}
			return context.getKeypathModel( fragment.ractive.root );
		}
		if ( ref === '@index' || ref === '@key' ) {
			var repeater = fragment.findRepeatingFragment();
			// make sure the found fragment is actually an iteration
			if ( !repeater.isIteration ) return;
			return repeater.context.getKeyModel( repeater[ ref[1] === 'i' ? 'index' : 'key' ] );
		}
		if ( ref === '@this' ) {
			return fragment.ractive.viewmodel.getRactiveModel();
		}
		if ( ref === '@global' ) {
			return GlobalModel$1;
		}

		// ancestor references
		if ( ref[0] === '~' ) return fragment.ractive.viewmodel.joinAll( splitKeypathI( ref.slice( 2 ) ) );
		if ( ref[0] === '.' ) {
			var parts = ref.split( '/' );

			while ( parts[0] === '.' || parts[0] === '..' ) {
				var part = parts.shift();

				if ( part === '..' ) {
					context = context.parent;
				}
			}

			ref = parts.join( '/' );

			// special case - `{{.foo}}` means the same as `{{./foo}}`
			if ( ref[0] === '.' ) ref = ref.slice( 1 );
			return context.joinAll( splitKeypathI( ref ) );
		}

		return resolveAmbiguousReference( fragment, ref );
	}

	function Ractive$get ( keypath, opts ) {
		if ( typeof keypath !== 'string' ) return this.viewmodel.get( true, keypath );

		var keys = splitKeypathI( keypath );
		var key = keys[0];

		var model;

		if ( !this.viewmodel.has( key ) ) {
			// if this is an inline component, we may need to create
			// an implicit mapping
			if ( this.component && !this.isolated ) {
				model = resolveReference( this.component.parentFragment, key );

				if ( model ) {
					this.viewmodel.map( key, model );
				}
			}
		}

		model = this.viewmodel.joinAll( keys );
		return model.get( true, opts );
	}

	function gatherRefs( fragment ) {
		var key = {}, index = {};

		// walk up the template gather refs as we go
		while ( fragment ) {
			if ( fragment.parent && ( fragment.parent.indexRef || fragment.parent.keyRef ) ) {
				var ref = fragment.parent.indexRef;
				if ( ref && !( ref in index ) ) index[ref] = fragment.index;
				ref = fragment.parent.keyRef;
				if ( ref && !( ref in key ) ) key[ref] = fragment.key;
			}

			if ( fragment.componentParent && !fragment.ractive.isolated ) {
				fragment = fragment.componentParent;
			} else {
				fragment = fragment.parent;
			}
		}

		return { key: key, index: index };
	}

	// This function takes an array, the name of a mutator method, and the
	// arguments to call that mutator method with, and returns an array that
	// maps the old indices to their new indices.

	// So if you had something like this...
	//
	//     array = [ 'a', 'b', 'c', 'd' ];
	//     array.push( 'e' );
	//
	// ...you'd get `[ 0, 1, 2, 3 ]` - in other words, none of the old indices
	// have changed. If you then did this...
	//
	//     array.unshift( 'z' );
	//
	// ...the indices would be `[ 1, 2, 3, 4, 5 ]` - every item has been moved
	// one higher to make room for the 'z'. If you removed an item, the new index
	// would be -1...
	//
	//     array.splice( 2, 2 );
	//
	// ...this would result in [ 0, 1, -1, -1, 2, 3 ].
	//
	// This information is used to enable fast, non-destructive shuffling of list
	// sections when you do e.g. `ractive.splice( 'items', 2, 2 );

	function getNewIndices ( length, methodName, args ) {
		var spliceArguments, newIndices = [], removeStart, removeEnd, balance, i;

		spliceArguments = getSpliceEquivalent( length, methodName, args );

		if ( !spliceArguments ) {
			return null; // TODO support reverse and sort?
		}

		balance = ( spliceArguments.length - 2 ) - spliceArguments[1];

		removeStart = Math.min( length, spliceArguments[0] );
		removeEnd = removeStart + spliceArguments[1];
		newIndices.startIndex = removeStart;

		for ( i = 0; i < removeStart; i += 1 ) {
			newIndices.push( i );
		}

		for ( ; i < removeEnd; i += 1 ) {
			newIndices.push( -1 );
		}

		for ( ; i < length; i += 1 ) {
			newIndices.push( i + balance );
		}

		// there is a net shift for the rest of the array starting with index + balance
		if ( balance !== 0 ) {
			newIndices.touchedFrom = spliceArguments[0];
		} else {
			newIndices.touchedFrom = length;
		}

		return newIndices;
	}


	// The pop, push, shift an unshift methods can all be represented
	// as an equivalent splice
	function getSpliceEquivalent ( length, methodName, args ) {
		switch ( methodName ) {
			case 'splice':
				if ( args[0] !== undefined && args[0] < 0 ) {
					args[0] = length + Math.max( args[0], -length );
				}

				if ( args[0] === undefined ) args[0] = 0;

				while ( args.length < 2 ) {
					args.push( length - args[0] );
				}

				if ( typeof args[1] !== 'number' ) {
					args[1] = length - args[0];
				}

				// ensure we only remove elements that exist
				args[1] = Math.min( args[1], length - args[0] );

				return args;

			case 'sort':
			case 'reverse':
				return null;

			case 'pop':
				if ( length ) {
					return [ length - 1, 1 ];
				}
				return [ 0, 0 ];

			case 'push':
				return [ length, 0 ].concat( args );

			case 'shift':
				return [ 0, length ? 1 : 0 ];

			case 'unshift':
				return [ 0, 0 ].concat( args );
		}
	}

	var arrayProto = Array.prototype;

	function makeArrayMethod ( methodName ) {
		function path ( keypath ) {
			var args = [], len = arguments.length - 1;
			while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

			return model( this.viewmodel.joinAll( splitKeypathI( keypath ) ), args );
		}

		function model ( mdl, args ) {
			var array = mdl.get();

			if ( !isArray( array ) ) {
				if ( array === undefined ) {
					array = [];
					var result$1 = arrayProto[ methodName ].apply( array, args );
					var promise$1 = runloop.start( this, true ).then( function () { return result$1; } );
					mdl.set( array );
					runloop.end();
					return promise$1;
				} else {
					throw new Error( ("shuffle array method " + methodName + " called on non-array at " + (mdl.getKeypath())) );
				}
			}

			var newIndices = getNewIndices( array.length, methodName, args );
			var result = arrayProto[ methodName ].apply( array, args );

			var promise = runloop.start( this, true ).then( function () { return result; } );
			promise.result = result;

			if ( newIndices ) {
				mdl.shuffle( newIndices );
			} else {
				mdl.set( result );
			}

			runloop.end();

			return promise;
		}

		return { path: path, model: model };
	}

	var comparators = {};

	function getComparator ( option ) {
		if ( !option ) return null; // use existing arrays
		if ( option === true ) return JSON.stringify;
		if ( typeof option === 'function' ) return option;

		if ( typeof option === 'string' ) {
			return comparators[ option ] || ( comparators[ option ] = function ( thing ) { return thing[ option ]; } );
		}

		throw new Error( 'If supplied, options.compare must be a string, function, or `true`' ); // TODO link to docs
	}

	function merge$1 ( ractive, model, array, options ) {
		var promise = runloop.start( ractive, true );
		var value = model.get();

		if ( !isArray( value ) || !isArray( array ) ) {
			throw new Error( 'You cannot merge an array with a non-array' );
		}

		var comparator = getComparator( options && options.compare );
		model.merge( array, comparator );

		runloop.end();
		return promise;
	}

	function thisRactive$merge ( keypath, array, options ) {
		return merge$1( this, this.viewmodel.joinAll( splitKeypathI( keypath ) ), array, options );
	}

	var updateHook = new Hook( 'update' );

	function update$2 ( ractive, model ) {
		// if the parent is wrapped, the adaptor will need to be updated before
		// updating on this keypath
		if ( model.parent && model.parent.wrapper ) {
			model.parent.adapt();
		}

		var promise = runloop.start( ractive, true );

		model.mark();
		model.registerChange( model.getKeypath(), model.get() );

		if ( !model.isRoot ) {
			// there may be unresolved refs that are now resolvable up the context tree
			var parent = model.parent, key = model.key;
			while ( parent && !parent.isRoot ) {
				if ( parent.clearUnresolveds ) parent.clearUnresolveds( key );
				key = parent.key;
				parent = parent.parent;
			}
		}

		// notify upstream of changes
		model.notifyUpstream();

		runloop.end();

		updateHook.fire( ractive, model );

		return promise;
	}

	function Ractive$update ( keypath ) {
		if ( keypath ) keypath = splitKeypathI( keypath );

		return update$2( this, keypath ? this.viewmodel.joinAll( keypath ) : this.viewmodel );
	}

	var modelPush = makeArrayMethod( 'push' ).model;
	var modelPop = makeArrayMethod( 'pop' ).model;
	var modelShift = makeArrayMethod( 'shift' ).model;
	var modelUnshift = makeArrayMethod( 'unshift' ).model;
	var modelSort = makeArrayMethod( 'sort' ).model;
	var modelSplice = makeArrayMethod( 'splice' ).model;
	var modelReverse = makeArrayMethod( 'reverse' ).model;

	// TODO: at some point perhaps this could support relative * keypaths?
	function build$1 ( el, keypath, value ) {
		var sets = [];

		// set multiple keypaths in one go
		if ( isObject( keypath ) ) {
			for ( var k in keypath ) {
				if ( keypath.hasOwnProperty( k ) ) {
					sets.push( [ findModel( el, k ).model, keypath[k] ] );
				}
			}

		}
		// set a single keypath
		else {
			sets.push( [ findModel( el, keypath ).model, value ] );
		}

		return sets;
	}

	// get relative keypaths and values
	function get ( keypath ) {
		if ( !keypath ) return this._element.parentFragment.findContext().get( true );

		var model = resolveReference( this._element.parentFragment, keypath );

		return model ? model.get( true ) : undefined;
	}

	function resolve$1 ( path, ractive ) {
		var ref = findModel( this, path ), model = ref.model, instance = ref.instance;
		return model ? model.getKeypath( ractive || instance ) : path;
	}

	function findModel ( el, path ) {
		var frag = el._element.parentFragment;

		if ( typeof path !== 'string' ) {
			return { model: frag.findContext(), instance: path };
		}

		return { model: resolveReference( frag, path ), instance: frag.ractive };
	}

	// the usual mutation suspects
	function add$1 ( keypath, value ) {
		if ( value === undefined ) value = 1;
		if ( !isNumeric( value ) ) throw new Error( 'Bad arguments' );
		return set( this.ractive, build$1( this, keypath, value ).map( function ( pair ) {
			var model = pair[0], val = pair[1], value = model.get();
			if ( !isNumeric( val ) || !isNumeric( value ) ) throw new Error( 'Cannot add non-numeric value' );
			return [ model, value + val ];
		}) );
	}

	function animate ( keypath, value, options ) {
		var model = findModel( this, keypath ).model;
		return protoAnimate( this.ractive, model, value, options );
	}

	function link ( source, dest ) {
		var there = findModel( this, source ).model, here = findModel( this, dest ).model;
		var promise = runloop.start( this.ractive, true );
		here.link( there, source );
		runloop.end();
		return promise;
	}

	function merge ( keypath, array, options ) {
		return merge$1( this.ractive, findModel( this, keypath ).model, array, options );
	}

	function pop ( keypath ) {
		return modelPop( findModel( this, keypath ).model, [] );
	}

	function push ( keypath ) {
		var values = [], len = arguments.length - 1;
		while ( len-- > 0 ) values[ len ] = arguments[ len + 1 ];

		return modelPush( findModel( this, keypath ).model, values );
	}

	function reverse ( keypath ) {
		return modelReverse( findModel( this, keypath ).model, [] );
	}

	function set$1 ( keypath, value ) {
		return set( this.ractive, build$1( this, keypath, value ) );
	}

	function shift ( keypath ) {
		return modelShift( findModel( this, keypath ).model, [] );
	}

	function splice ( keypath, index, drop ) {
		var add = [], len = arguments.length - 3;
		while ( len-- > 0 ) add[ len ] = arguments[ len + 3 ];

		add.unshift( index, drop );
		return modelSplice( findModel( this, keypath ).model, add );
	}

	function sort ( keypath ) {
		return modelSort( findModel( this, keypath ).model, [] );
	}

	function subtract ( keypath, value ) {
		if ( value === undefined ) value = 1;
		if ( !isNumeric( value ) ) throw new Error( 'Bad arguments' );
		return set( this.ractive, build$1( this, keypath, value ).map( function ( pair ) {
			var model = pair[0], val = pair[1], value = model.get();
			if ( !isNumeric( val ) || !isNumeric( value ) ) throw new Error( 'Cannot add non-numeric value' );
			return [ model, value - val ];
		}) );
	}

	function toggle ( keypath ) {
		var ref = findModel( this, keypath ), model = ref.model;
		return set( this.ractive, [ [ model, !model.get() ] ] );
	}

	function unlink ( dest ) {
		var here = findModel( this, dest ).model;
		var promise = runloop.start( this.ractive, true );
		if ( here.owner && here.owner._link ) here.owner.unlink();
		runloop.end();
		return promise;
	}

	function unshift ( keypath ) {
		var add = [], len = arguments.length - 1;
		while ( len-- > 0 ) add[ len ] = arguments[ len + 1 ];

		return modelUnshift( findModel( this, keypath ).model, add );
	}

	function update$1 ( keypath ) {
		return update$2( this.ractive, findModel( this, keypath ).model );
	}

	function updateModel ( keypath, cascade ) {
		var ref = findModel( this, keypath ), model = ref.model;
		var promise = runloop.start( this.ractive, true );
		model.updateFromBindings( cascade );
		runloop.end();
		return promise;
	}

	// two-way binding related helpers
	function isBound () {
		var ref = getBindingModel( this ), model = ref.model;
		return !!model;
	}

	function getBindingPath ( ractive ) {
		var ref = getBindingModel( this ), model = ref.model, instance = ref.instance;
		if ( model ) return model.getKeypath( ractive || instance );
	}

	function getBinding () {
		var ref = getBindingModel( this ), model = ref.model;
		if ( model ) return model.get( true );
	}

	function getBindingModel ( ctx ) {
		var el = ctx._element;
		return { model: el.binding && el.binding.model, instance: el.parentFragment.ractive };
	}

	function setBinding ( value ) {
		var ref = getBindingModel( this ), model = ref.model;
		return set( this.ractive, [ [ model, value ] ] );
	}

	// deprecated getters
	function keypath () {
		warnOnceIfDebug( ("Object property keypath is deprecated, please use resolve() instead.") );
		return this.resolve();
	}

	function rootpath () {
		warnOnceIfDebug( ("Object property rootpath is deprecated, please use resolve( ractive.root ) instead.") );
		return this.resolve( this.ractive.root );
	}

	function context () {
		warnOnceIfDebug( ("Object property context is deprecated, please use get() instead.") );
		return this.get();
	}

	function index () {
		warnOnceIfDebug( ("Object property index is deprecated, you can use get( \"indexName\" ) instead.") );
		return gatherRefs( this._element.parentFragment ).index;
	}

	function key () {
		warnOnceIfDebug( ("Object property key is deprecated, you can use get( \"keyName\" ) instead.") );
		return gatherRefs( this._element.parentFragment ).key;
	}

	function addHelpers ( obj, element ) {
		defineProperties( obj, {
			_element: { value: element },
			ractive: { value: element.parentFragment.ractive },
			resolve: { value: resolve$1 },
			get: { value: get },

			add: { value: add$1 },
			animate: { value: animate },
			link: { value: link },
			merge: { value: merge },
			pop: { value: pop },
			push: { value: push },
			reverse: { value: reverse },
			set: { value: set$1 },
			shift: { value: shift },
			sort: { value: sort },
			splice: { value: splice },
			subtract: { value: subtract },
			toggle: { value: toggle },
			unlink: { value: unlink },
			unshift: { value: unshift },
			update: { value: update$1 },
			updateModel: { value: updateModel },

			isBound: { value: isBound },
			getBindingPath: { value: getBindingPath },
			getBinding: { value: getBinding },
			setBinding: { value: setBinding },

			keypath: { get: keypath },
			rootpath: { get: rootpath },
			context: { get: context },
			index: { get: index },
			key: { get: key }
		});

		return obj;
	}

	var query = doc && doc.querySelector;

	function staticInfo( node ) {
		if ( typeof node === 'string' && query ) {
			node = query.call( document, node );
		}

		if ( !node || !node._ractive ) return undefined;

		var storage = node._ractive;

		return addHelpers( {}, storage.proxy );
	}

	function getNodeInfo( node ) {
		if ( typeof node === 'string' ) {
			node = this.find( node );
		}

		return staticInfo( node );
	}

	var insertHook = new Hook( 'insert' );

	function Ractive$insert ( target, anchor ) {
		if ( !this.fragment.rendered ) {
			// TODO create, and link to, documentation explaining this
			throw new Error( 'The API has changed - you must call `ractive.render(target[, anchor])` to render your Ractive instance. Once rendered you can use `ractive.insert()`.' );
		}

		target = getElement( target );
		anchor = getElement( anchor ) || null;

		if ( !target ) {
			throw new Error( 'You must specify a valid target to insert into' );
		}

		target.insertBefore( this.detach(), anchor );
		this.el = target;

		( target.__ractive_instances__ || ( target.__ractive_instances__ = [] ) ).push( this );
		this.isDetached = false;

		fireInsertHook( this );
	}

	function fireInsertHook( ractive ) {
		insertHook.fire( ractive );

		ractive.findAllComponents('*').forEach( function ( child ) {
			fireInsertHook( child.instance );
		});
	}

	function link$1( there, here ) {
		if ( here === there || (there + '.').indexOf( here + '.' ) === 0 || (here + '.').indexOf( there + '.' ) === 0 ) {
			throw new Error( 'A keypath cannot be linked to itself.' );
		}

		var promise = runloop.start();
		var model;

		// may need to allow a mapping to resolve implicitly
		var sourcePath = splitKeypathI( there );
		if ( !this.viewmodel.has( sourcePath[0] ) && this.component ) {
			model = resolveReference( this.component.parentFragment, sourcePath[0] );
			model = model.joinAll( sourcePath.slice( 1 ) );
		}

		this.viewmodel.joinAll( splitKeypathI( here ) ).link( model || this.viewmodel.joinAll( sourcePath ), there );

		runloop.end();

		return promise;
	}

	var ReferenceResolver = function ReferenceResolver ( fragment, reference, callback ) {
		var this$1 = this;

			this.fragment = fragment;
		this.reference = normalise( reference );
		this.callback = callback;

		this.keys = splitKeypathI( reference );
		this.resolved = false;

		this.contexts = [];

		// TODO the consumer should take care of addUnresolved
		// we attach to all the contexts between here and the root
		// - whenever their values change, they can quickly
		// check to see if we can resolve
		while ( fragment ) {
			if ( fragment.context ) {
				fragment.context.addUnresolved( this$1.keys[0], this$1 );
				this$1.contexts.push( fragment.context );
			}

			fragment = fragment.componentParent || fragment.parent;
		}
	};

	ReferenceResolver.prototype.attemptResolution = function attemptResolution () {
		if ( this.resolved ) return;

		var model = resolveAmbiguousReference( this.fragment, this.reference );

		if ( model ) {
			this.resolved = true;
			this.callback( model );
		}
	};

	ReferenceResolver.prototype.forceResolution = function forceResolution () {
		if ( this.resolved ) return;

		var model = this.fragment.findContext().joinAll( this.keys );
		this.callback( model );
		this.resolved = true;
	};

	ReferenceResolver.prototype.rebinding = function rebinding ( next, previous ) {
		var this$1 = this;

			if ( previous ) previous.removeUnresolved( this.keys[0], this );
		if ( next ) runloop.scheduleTask( function () { return next.addUnresolved( this$1.keys[0], this$1 ); } );
	};

	ReferenceResolver.prototype.unbind = function unbind () {
		var this$1 = this;

			if ( this.fragment ) removeFromArray( this.fragment.unresolved, this );

		if ( this.resolved ) return;

		this.contexts.forEach( function ( c ) { return c.removeUnresolved( this$1.keys[0], this$1 ); } );
	};

	function observe ( keypath, callback, options ) {
		var this$1 = this;

		var observers = [];
		var map;

		if ( isObject( keypath ) ) {
			map = keypath;
			options = callback || {};

			Object.keys( map ).forEach( function ( keypath ) {
				var callback = map[ keypath ];

				var keypaths = keypath.split( ' ' );
				if ( keypaths.length > 1 ) keypaths = keypaths.filter( function ( k ) { return k; } );

				keypaths.forEach( function ( keypath ) {
					observers.push( createObserver( this$1, keypath, callback, options ) );
				});
			});
		}

		else {
			var keypaths;

			if ( typeof keypath === 'function' ) {
				options = callback;
				callback = keypath;
				keypaths = [ '' ];
			} else {
				keypaths = keypath.split( ' ' );
			}

			if ( keypaths.length > 1 ) keypaths = keypaths.filter( function ( k ) { return k; } );

			keypaths.forEach( function ( keypath ) {
				observers.push( createObserver( this$1, keypath, callback, options || {} ) );
			});
		}

		// add observers to the Ractive instance, so they can be
		// cancelled on ractive.teardown()
		this._observers.push.apply( this._observers, observers );

		return {
			cancel: function () {
				observers.forEach( function ( observer ) {
					removeFromArray ( this$1._observers, observer );
					observer.cancel();
				} );
			}
		};
	}

	function createObserver ( ractive, keypath, callback, options ) {
		var viewmodel = ractive.viewmodel;

		var keys = splitKeypathI( keypath );
		var wildcardIndex = keys.indexOf( '*' );
		options.keypath = keypath;

		// normal keypath - no wildcards
		if ( !~wildcardIndex ) {
			var key = keys[0];
			var model;

			// if not the root model itself, check if viewmodel has key.
			if ( key !== '' && !viewmodel.has( key ) ) {
				// if this is an inline component, we may need to create an implicit mapping
				if ( ractive.component && !ractive.isolated ) {
					model = resolveReference( ractive.component.parentFragment, key );
					if ( model ) {
						viewmodel.map( key, model );
						model = viewmodel.joinAll( keys );
					}
				}
			} else {
				model = viewmodel.joinAll( keys );
			}

			return new Observer( ractive, model, callback, options );
		}

		// pattern observers - more complex case
		var baseModel = wildcardIndex === 0 ?
			viewmodel :
			viewmodel.joinAll( keys.slice( 0, wildcardIndex ) );

		return new PatternObserver( ractive, baseModel, keys.splice( wildcardIndex ), callback, options );
	}

	var Observer = function Observer ( ractive, model, callback, options ) {
		var this$1 = this;

			this.context = options.context || ractive;
		this.callback = callback;
		this.ractive = ractive;

		if ( model ) this.resolved( model );
		else {
			this.keypath = options.keypath;
			this.resolver = new ReferenceResolver( ractive.fragment, options.keypath, function ( model ) {
				this$1.resolved( model );
			});
		}

		if ( options.init !== false ) {
			this.dirty = true;
			this.dispatch();
		} else {
			this.oldValue = this.newValue;
		}

		this.defer = options.defer;
		this.once = options.once;
		this.strict = options.strict;

		this.dirty = false;
	};

	Observer.prototype.cancel = function cancel () {
		this.cancelled = true;
		if ( this.model ) {
			this.model.unregister( this );
		} else {
			this.resolver.unbind();
		}
	};

	Observer.prototype.dispatch = function dispatch () {
		if ( !this.cancelled ) {
			this.callback.call( this.context, this.newValue, this.oldValue, this.keypath );
			this.oldValue = this.model ? this.model.get() : this.newValue;
			this.dirty = false;
		}
	};

	Observer.prototype.handleChange = function handleChange () {
		var this$1 = this;

			if ( !this.dirty ) {
			var newValue = this.model.get();
			if ( isEqual( newValue, this.oldValue ) ) return;

			this.newValue = newValue;

			if ( this.strict && this.newValue === this.oldValue ) return;

			runloop.addObserver( this, this.defer );
			this.dirty = true;

			if ( this.once ) runloop.scheduleTask( function () { return this$1.cancel(); } );
		}
	};

	Observer.prototype.rebinding = function rebinding ( next, previous ) {
		var this$1 = this;

			next = rebindMatch( this.keypath, next, previous );
		// TODO: set up a resolver if next is undefined?
		if ( next === this.model ) return false;

		if ( this.model ) this.model.unregister( this );
		if ( next ) next.addShuffleTask( function () { return this$1.resolved( next ); } );
	};

	Observer.prototype.resolved = function resolved ( model ) {
		this.model = model;
		this.keypath = model.getKeypath( this.ractive );

		this.oldValue = undefined;
		this.newValue = model.get();

		model.register( this );
	};

	var PatternObserver = function PatternObserver ( ractive, baseModel, keys, callback, options ) {
		var this$1 = this;

			this.context = options.context || ractive;
		this.ractive = ractive;
		this.baseModel = baseModel;
		this.keys = keys;
		this.callback = callback;

		var pattern = keys.join( '\\.' ).replace( /\*/g, '(.+)' );
		var baseKeypath = baseModel.getKeypath( ractive );
		this.pattern = new RegExp( ("^" + (baseKeypath ? baseKeypath + '\\.' : '') + "" + pattern + "$") );

		this.oldValues = {};
		this.newValues = {};

		this.defer = options.defer;
		this.once = options.once;
		this.strict = options.strict;

		this.dirty = false;
		this.changed = [];
		this.partial = false;

		var models = baseModel.findMatches( this.keys );

		models.forEach( function ( model ) {
			this$1.newValues[ model.getKeypath( this$1.ractive ) ] = model.get();
		});

		if ( options.init !== false ) {
			this.dispatch();
		} else {
			this.oldValues = this.newValues;
		}

		baseModel.registerPatternObserver( this );
	};

	PatternObserver.prototype.cancel = function cancel () {
		this.baseModel.unregisterPatternObserver( this );
	};

	PatternObserver.prototype.dispatch = function dispatch () {
		var this$1 = this;

			var newValues = this.newValues;
		this.newValues = {};
		Object.keys( newValues ).forEach( function ( keypath ) {
			if ( this$1.newKeys && !this$1.newKeys[ keypath ] ) return;

			var newValue = newValues[ keypath ];
			var oldValue = this$1.oldValues[ keypath ];

			if ( this$1.strict && newValue === oldValue ) return;
			if ( isEqual( newValue, oldValue ) ) return;

			var args = [ newValue, oldValue, keypath ];
			if ( keypath ) {
				var wildcards = this$1.pattern.exec( keypath );
				if ( wildcards ) {
					args = args.concat( wildcards.slice( 1 ) );
				}
			}

			this$1.callback.apply( this$1.context, args );
		});

		if ( this.partial ) {
			for ( var k in newValues ) {
				this.oldValues[k] = newValues[k];
			}
		} else {
			this.oldValues = newValues;
		}

		this.newKeys = null;
		this.dirty = false;
	};

	PatternObserver.prototype.notify = function notify ( key ) {
		this.changed.push( key );
	};

	PatternObserver.prototype.shuffle = function shuffle ( newIndices ) {
		var this$1 = this;

			if ( !isArray( this.baseModel.value ) ) return;

		var base = this.baseModel.getKeypath( this.ractive );
		var max = this.baseModel.value.length;
		var suffix = this.keys.length > 1 ? '.' + this.keys.slice( 1 ).join( '.' ) : '';

		this.newKeys = {};
		for ( var i = 0; i < newIndices.length; i++ ) {
			if ( newIndices[ i ] === -1 || newIndices[ i ] === i ) continue;
			this$1.newKeys[ ("" + base + "." + i + "" + suffix) ] = true;
		}

		for ( var i$1 = newIndices.touchedFrom; i$1 < max; i$1++ ) {
			this$1.newKeys[ ("" + base + "." + i$1 + "" + suffix) ] = true;
		}
	};

	PatternObserver.prototype.handleChange = function handleChange () {
		var this$1 = this;

			if ( !this.dirty || this.changed.length ) {
			if ( !this.dirty ) this.newValues = {};

			// handle case where previously extant keypath no longer exists -
			// observer should still fire, with undefined as new value
			// TODO huh. according to the test suite that's not the case...
			// NOTE: I don't think this will work with partial updates
			// Object.keys( this.oldValues ).forEach( keypath => {
			// this.newValues[ keypath ] = undefined;
			// });

			if ( !this.changed.length ) {
				this.baseModel.findMatches( this.keys ).forEach( function ( model ) {
					var keypath = model.getKeypath( this$1.ractive );
					this$1.newValues[ keypath ] = model.get();
				});
				this.partial = false;
			} else {
				var count = 0;
				var ok = this.baseModel.isRoot ?
					this.changed.map( function ( keys ) { return keys.map( escapeKey ).join( '.' ); } ) :
					this.changed.map( function ( keys ) { return this$1.baseModel.getKeypath( this$1.ractive ) + '.' + keys.map( escapeKey ).join( '.' ); } );

				this.baseModel.findMatches( this.keys ).forEach( function ( model ) {
					var keypath = model.getKeypath( this$1.ractive );
					var check = function ( k ) {
						return ( k.indexOf( keypath ) === 0 && ( k.length === keypath.length || k[ keypath.length ] === '.' ) ) ||
								   ( keypath.indexOf( k ) === 0 && ( k.length === keypath.length || keypath[ k.length ] === '.' ) );
					};

					// is this model on a changed keypath?
					if ( ok.filter( check ).length ) {
						count++;
						this$1.newValues[ keypath ] = model.get();
					}
				});

				// no valid change triggered, so bail to avoid breakage
				if ( !count ) return;

				this.partial = true;
			}

			runloop.addObserver( this, this.defer );
			this.dirty = true;
			this.changed.length = 0;

			if ( this.once ) this.cancel();
		}
	};

	function observeList ( keypath, callback, options ) {
		if ( typeof keypath !== 'string' ) {
			throw new Error( 'ractive.observeList() must be passed a string as its first argument' );
		}

		var model = this.viewmodel.joinAll( splitKeypathI( keypath ) );
		var observer = new ListObserver( this, model, callback, options || {} );

		// add observer to the Ractive instance, so it can be
		// cancelled on ractive.teardown()
		this._observers.push( observer );

		return {
			cancel: function () {
				observer.cancel();
			}
		};
	}

	function negativeOne () {
		return -1;
	}

	var ListObserver = function ListObserver ( context, model, callback, options ) {
		this.context = context;
		this.model = model;
		this.keypath = model.getKeypath();
		this.callback = callback;

		this.pending = null;

		model.register( this );

		if ( options.init !== false ) {
			this.sliced = [];
			this.shuffle([]);
			this.handleChange();
		} else {
			this.sliced = this.slice();
		}
	};

	ListObserver.prototype.handleChange = function handleChange () {
		if ( this.pending ) {
			// post-shuffle
			this.callback( this.pending );
			this.pending = null;
		}

		else {
			// entire array changed
			this.shuffle( this.sliced.map( negativeOne ) );
			this.handleChange();
		}
	};

	ListObserver.prototype.shuffle = function shuffle ( newIndices ) {
		var this$1 = this;

			var newValue = this.slice();

		var inserted = [];
		var deleted = [];
		var start;

		var hadIndex = {};

		newIndices.forEach( function ( newIndex, oldIndex ) {
			hadIndex[ newIndex ] = true;

			if ( newIndex !== oldIndex && start === undefined ) {
				start = oldIndex;
			}

			if ( newIndex === -1 ) {
				deleted.push( this$1.sliced[ oldIndex ] );
			}
		});

		if ( start === undefined ) start = newIndices.length;

		var len = newValue.length;
		for ( var i = 0; i < len; i += 1 ) {
			if ( !hadIndex[i] ) inserted.push( newValue[i] );
		}

		this.pending = { inserted: inserted, deleted: deleted, start: start };
		this.sliced = newValue;
	};

	ListObserver.prototype.slice = function slice () {
		var value = this.model.get();
		return isArray( value ) ? value.slice() : [];
	};

	var onceOptions = { init: false, once: true };

	function observeOnce ( keypath, callback, options ) {
		if ( isObject( keypath ) || typeof keypath === 'function' ) {
			options = extendObj( callback || {}, onceOptions );
			return this.observe( keypath, options );
		}

		options = extendObj( options || {}, onceOptions );
		return this.observe( keypath, callback, options );
	}

	function trim ( str ) { return str.trim(); };

	function notEmptyString ( str ) { return str !== ''; };

	function Ractive$off ( eventName, callback ) {
		// if no arguments specified, remove all callbacks
		var this$1 = this;

		if ( !eventName ) {
			// TODO use this code instead, once the following issue has been resolved
			// in PhantomJS (tests are unpassable otherwise!)
			// https://github.com/ariya/phantomjs/issues/11856
			// defineProperty( this, '_subs', { value: create( null ), configurable: true });
			for ( eventName in this._subs ) {
				delete this._subs[ eventName ];
			}
		}

		else {
			// Handle multiple space-separated event names
			var eventNames = eventName.split( ' ' ).map( trim ).filter( notEmptyString );

			eventNames.forEach( function ( eventName ) {
				var subscribers = this$1._subs[ eventName ];

				// If we have subscribers for this event...
				if ( subscribers ) {
					// ...if a callback was specified, only remove that
					if ( callback ) {
						// flag this callback as off so that any in-flight firings don't call
						// a cancelled handler - this is _slightly_ hacky
						callback.off = true;
						var index = subscribers.indexOf( callback );
						if ( index !== -1 ) {
							subscribers.splice( index, 1 );
						}
					}

					// ...otherwise remove all callbacks
					else {
						this$1._subs[ eventName ] = [];
					}
				}
			});
		}

		return this;
	}

	function Ractive$on ( eventName, callback ) {
		// allow multiple listeners to be bound in one go
		var this$1 = this;

		if ( typeof eventName === 'object' ) {
			var listeners = [];
			var n;

			for ( n in eventName ) {
				if ( eventName.hasOwnProperty( n ) ) {
					listeners.push( this.on( n, eventName[ n ] ) );
				}
			}

			return {
				cancel: function () {
					var listener;
					while ( listener = listeners.pop() ) listener.cancel();
				}
			};
		}

		// Handle multiple space-separated event names
		var eventNames = eventName.split( ' ' ).map( trim ).filter( notEmptyString );

		eventNames.forEach( function ( eventName ) {
			( this$1._subs[ eventName ] || ( this$1._subs[ eventName ] = [] ) ).push( callback );
		});

		return {
			cancel: function () { return this$1.off( eventName, callback ); }
		};
	}

	function Ractive$once ( eventName, handler ) {
		var listener = this.on( eventName, function () {
			handler.apply( this, arguments );
			listener.cancel();
		});

		// so we can still do listener.cancel() manually
		return listener;
	}

	var pop$1 = makeArrayMethod( 'pop' ).path;

	var push$1 = makeArrayMethod( 'push' ).path;

	var PREFIX = '/* Ractive.js component styles */';

	// Holds current definitions of styles.
	var styleDefinitions = [];

	// Flag to tell if we need to update the CSS
	var isDirty = false;

	// These only make sense on the browser. See additional setup below.
	var styleElement = null;
	var useCssText = null;

	function addCSS( styleDefinition ) {
		styleDefinitions.push( styleDefinition );
		isDirty = true;
	}

	function applyCSS() {

		// Apply only seems to make sense when we're in the DOM. Server-side renders
		// can call toCSS to get the updated CSS.
		if ( !doc || !isDirty ) return;

		if ( useCssText ) {
			styleElement.styleSheet.cssText = getCSS( null );
		} else {
			styleElement.innerHTML = getCSS( null );
		}

		isDirty = false;
	}

	function getCSS( cssIds ) {

		var filteredStyleDefinitions = cssIds ? styleDefinitions.filter( function ( style ) { return ~cssIds.indexOf( style.id ); } ) : styleDefinitions;

		return filteredStyleDefinitions.reduce( function ( styles, style ) { return ("" + styles + "\n\n/* {" + (style.id) + "} */\n" + (style.styles)); }, PREFIX );

	}

	// If we're on the browser, additional setup needed.
	if ( doc && ( !styleElement || !styleElement.parentNode ) ) {

		styleElement = doc.createElement( 'style' );
		styleElement.type = 'text/css';

		doc.getElementsByTagName( 'head' )[ 0 ].appendChild( styleElement );

		useCssText = !!styleElement.styleSheet;
	}

	var renderHook = new Hook( 'render' );
	var completeHook = new Hook( 'complete' );

	function render$1 ( ractive, target, anchor, occupants ) {
		// if `noIntro` is `true`, temporarily disable transitions
		var transitionsEnabled = ractive.transitionsEnabled;
		if ( ractive.noIntro ) ractive.transitionsEnabled = false;

		var promise = runloop.start( ractive, true );
		runloop.scheduleTask( function () { return renderHook.fire( ractive ); }, true );

		if ( ractive.fragment.rendered ) {
			throw new Error( 'You cannot call ractive.render() on an already rendered instance! Call ractive.unrender() first' );
		}

		anchor = getElement( anchor ) || ractive.anchor;

		ractive.el = target;
		ractive.anchor = anchor;

		// ensure encapsulated CSS is up-to-date
		if ( ractive.cssId ) applyCSS();

		if ( target ) {
			( target.__ractive_instances__ || ( target.__ractive_instances__ = [] ) ).push( ractive );

			if ( anchor ) {
				var docFrag = doc.createDocumentFragment();
				ractive.fragment.render( docFrag );
				target.insertBefore( docFrag, anchor );
			} else {
				ractive.fragment.render( target, occupants );
			}
		}

		runloop.end();
		ractive.transitionsEnabled = transitionsEnabled;

		return promise.then( function () { return completeHook.fire( ractive ); } );
	}

	function Ractive$render ( target, anchor ) {
		if ( this.torndown ) {
			warnIfDebug( 'ractive.render() was called on a Ractive instance that was already torn down' );
			return Promise.resolve();
		}

		target = getElement( target ) || this.el;

		if ( !this.append && target ) {
			// Teardown any existing instances *before* trying to set up the new one -
			// avoids certain weird bugs
			var others = target.__ractive_instances__;
			if ( others ) others.forEach( teardown );

			// make sure we are the only occupants
			if ( !this.enhance ) {
				target.innerHTML = ''; // TODO is this quicker than removeChild? Initial research inconclusive
			}
		}

		var occupants = this.enhance ? toArray( target.childNodes ) : null;
		var promise = render$1( this, target, anchor, occupants );

		if ( occupants ) {
			while ( occupants.length ) target.removeChild( occupants.pop() );
		}

		return promise;
	}

	var adaptConfigurator = {
		extend: function ( Parent, proto, options ) {
			proto.adapt = combine( proto.adapt, ensureArray( options.adapt ) );
		},

		init: function () {}
	};

	function combine ( a, b ) {
		var c = a.slice();
		var i = b.length;

		while ( i-- ) {
			if ( !~c.indexOf( b[i] ) ) {
				c.push( b[i] );
			}
		}

		return c;
	}

	var remove = /\/\*(?:[\s\S]*?)\*\//g;
	var escape = /url\(\s*(['"])(?:\\[\s\S]|(?!\1).)*\1\s*\)|url\((?:\\[\s\S]|[^)])*\)|(['"])(?:\\[\s\S]|(?!\2).)*\2/gi;
	var value = /\0(\d+)/g;

	// Removes comments and strings from the given CSS to make it easier to parse.
	// Callback receives the cleaned CSS and a function which can be used to put
	// the removed strings back in place after parsing is done.
	function cleanCss ( css, callback, additionalReplaceRules ) {
		if ( additionalReplaceRules === void 0 ) additionalReplaceRules = [];

		var values = [];
		var reconstruct = function ( css ) { return css.replace( value, function ( match, n ) { return values[ n ]; } ); };
		css = css.replace( escape, function ( match ) { return ("\u0000" + (values.push( match ) - 1)); }).replace( remove, '' );

		additionalReplaceRules.forEach( function ( pattern ) {
			css = css.replace( pattern, function ( match ) { return ("\u0000" + (values.push( match ) - 1)); } );
		});

		return callback( css, reconstruct );
	}

	var selectorsPattern = /(?:^|\}|\{)\s*([^\{\}\0]+)\s*(?=\{)/g;
	var keyframesDeclarationPattern = /@keyframes\s+[^\{\}]+\s*\{(?:[^{}]+|\{[^{}]+})*}/gi;
	var selectorUnitPattern = /((?:(?:\[[^\]]+\])|(?:[^\s\+\>~:]))+)((?:::?[^\s\+\>\~\(:]+(?:\([^\)]+\))?)*\s*[\s\+\>\~]?)\s*/g;
	var excludePattern = /^(?:@|\d+%)/;
	var dataRvcGuidPattern = /\[data-ractive-css~="\{[a-z0-9-]+\}"]/g;

	function trim$1 ( str ) {
		return str.trim();
	}

	function extractString ( unit ) {
		return unit.str;
	}

	function transformSelector ( selector, parent ) {
		var selectorUnits = [];
		var match;

		while ( match = selectorUnitPattern.exec( selector ) ) {
			selectorUnits.push({
				str: match[0],
				base: match[1],
				modifiers: match[2]
			});
		}

		// For each simple selector within the selector, we need to create a version
		// that a) combines with the id, and b) is inside the id
		var base = selectorUnits.map( extractString );

		var transformed = [];
		var i = selectorUnits.length;

		while ( i-- ) {
			var appended = base.slice();

			// Pseudo-selectors should go after the attribute selector
			var unit = selectorUnits[i];
			appended[i] = unit.base + parent + unit.modifiers || '';

			var prepended = base.slice();
			prepended[i] = parent + ' ' + prepended[i];

			transformed.push( appended.join( ' ' ), prepended.join( ' ' ) );
		}

		return transformed.join( ', ' );
	}

	function transformCss ( css, id ) {
		var dataAttr = "[data-ractive-css~=\"{" + id + "}\"]";

		var transformed;

		if ( dataRvcGuidPattern.test( css ) ) {
			transformed = css.replace( dataRvcGuidPattern, dataAttr );
		} else {
			transformed = cleanCss( css, function ( css, reconstruct ) {
				css = css.replace( selectorsPattern, function ( match, $1 ) {
					// don't transform at-rules and keyframe declarations
					if ( excludePattern.test( $1 ) ) return match;

					var selectors = $1.split( ',' ).map( trim$1 );
					var transformed = selectors
						.map( function ( selector ) { return transformSelector( selector, dataAttr ); } )
						.join( ', ' ) + ' ';

					return match.replace( $1, transformed );
				});

				return reconstruct( css );
			}, [ keyframesDeclarationPattern ]);
		}

		return transformed;
	}

	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	function uuid() {
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	var cssConfigurator = {
		name: 'css',

		// Called when creating a new component definition
		extend: function ( Parent, proto, options ) {
			if ( !options.css ) return;

			var id = uuid();
			var styles = options.noCssTransform ? options.css : transformCss( options.css, id );

			proto.cssId = id;

			addCSS( { id: id, styles: styles } );

		},

		// Called when creating a new component instance
		init: function ( Parent, target, options ) {
			if ( !options.css ) return;

			warnIfDebug( ("\nThe css option is currently not supported on a per-instance basis and will be discarded. Instead, we recommend instantiating from a component definition with a css option.\n\nconst Component = Ractive.extend({\n\t...\n\tcss: '/* your css */',\n\t...\n});\n\nconst componentInstance = new Component({ ... })\n\t\t") );
		}

	};

	function validate ( data ) {
		// Warn if userOptions.data is a non-POJO
		if ( data && data.constructor !== Object ) {
			if ( typeof data === 'function' ) {
				// TODO do we need to support this in the new Ractive() case?
			} else if ( typeof data !== 'object' ) {
				fatal( ("data option must be an object or a function, `" + data + "` is not valid") );
			} else {
				warnIfDebug( 'If supplied, options.data should be a plain JavaScript object - using a non-POJO as the root object may work, but is discouraged' );
			}
		}
	}

	var dataConfigurator = {
		name: 'data',

		extend: function ( Parent, proto, options ) {
			var key;
			var value;

			// check for non-primitives, which could cause mutation-related bugs
			if ( options.data && isObject( options.data ) ) {
				for ( key in options.data ) {
					value = options.data[ key ];

					if ( value && typeof value === 'object' ) {
						if ( isObject( value ) || isArray( value ) ) {
							warnIfDebug( ("Passing a `data` option with object and array properties to Ractive.extend() is discouraged, as mutating them is likely to cause bugs. Consider using a data function instead:\n\n  // this...\n  data: function () {\n    return {\n      myObject: {}\n    };\n  })\n\n  // instead of this:\n  data: {\n    myObject: {}\n  }") );
						}
					}
				}
			}

			proto.data = combine$1( proto.data, options.data );
		},

		init: function ( Parent, ractive, options ) {
			var result = combine$1( Parent.prototype.data, options.data );

			if ( typeof result === 'function' ) result = result.call( ractive );

			// bind functions to the ractive instance at the top level,
			// unless it's a non-POJO (in which case alarm bells should ring)
			if ( result && result.constructor === Object ) {
				for ( var prop in result ) {
					if ( typeof result[ prop ] === 'function' ) result[ prop ] = bind( result[ prop ], ractive );
				}
			}

			return result || {};
		},

		reset: function ( ractive ) {
			var result = this.init( ractive.constructor, ractive, ractive.viewmodel );
			ractive.viewmodel.root.set( result );
			return true;
		}
	};

	function combine$1 ( parentValue, childValue ) {
		validate( childValue );

		var parentIsFn = typeof parentValue === 'function';
		var childIsFn = typeof childValue === 'function';

		// Very important, otherwise child instance can become
		// the default data object on Ractive or a component.
		// then ractive.set() ends up setting on the prototype!
		if ( !childValue && !parentIsFn ) {
			childValue = {};
		}

		// Fast path, where we just need to copy properties from
		// parent to child
		if ( !parentIsFn && !childIsFn ) {
			return fromProperties( childValue, parentValue );
		}

		return function () {
			var child = childIsFn ? callDataFunction( childValue, this ) : childValue;
			var parent = parentIsFn ? callDataFunction( parentValue, this ) : parentValue;

			return fromProperties( child, parent );
		};
	}

	function callDataFunction ( fn, context ) {
		var data = fn.call( context );

		if ( !data ) return;

		if ( typeof data !== 'object' ) {
			fatal( 'Data function must return an object' );
		}

		if ( data.constructor !== Object ) {
			warnOnceIfDebug( 'Data function returned something other than a plain JavaScript object. This might work, but is strongly discouraged' );
		}

		return data;
	}

	function fromProperties ( primary, secondary ) {
		if ( primary && secondary ) {
			for ( var key in secondary ) {
				if ( !( key in primary ) ) {
					primary[ key ] = secondary[ key ];
				}
			}

			return primary;
		}

		return primary || secondary;
	}

	var TEMPLATE_VERSION = 4;

	var pattern = /\$\{([^\}]+)\}/g;

	function fromExpression ( body, length ) {
		if ( length === void 0 ) length = 0;

		var args = new Array( length );

		while ( length-- ) {
			args[length] = "_" + length;
		}

		// Functions created directly with new Function() look like this:
		//     function anonymous (_0 /**/) { return _0*2 }
		//
		// With this workaround, we get a little more compact:
		//     function (_0){return _0*2}
		return new Function( [], ("return function (" + (args.join(',')) + "){return(" + body + ");};") )();
	}

	function fromComputationString ( str, bindTo ) {
		var hasThis;

		var functionBody = 'return (' + str.replace( pattern, function ( match, keypath ) {
			hasThis = true;
			return ("__ractive.get(\"" + keypath + "\")");
		}) + ');';

		if ( hasThis ) functionBody = "var __ractive = this; " + functionBody;
		var fn = new Function( functionBody );
		return hasThis ? fn.bind( bindTo ) : fn;
	}

	var functions = create( null );

	function getFunction ( str, i ) {
		if ( functions[ str ] ) return functions[ str ];
		return functions[ str ] = createFunction( str, i );
	}

	function addFunctions( template ) {
		if ( !template ) return;

		var exp = template.e;

		if ( !exp ) return;

		Object.keys( exp ).forEach( function ( str ) {
			if ( functions[ str ] ) return;
			functions[ str ] = exp[ str ];
		});
	}

	var Parser;
	var ParseError;
	var leadingWhitespace = /^\s+/;
	ParseError = function ( message ) {
		this.name = 'ParseError';
		this.message = message;
		try {
			throw new Error(message);
		} catch (e) {
			this.stack = e.stack;
		}
	};

	ParseError.prototype = Error.prototype;

	Parser = function ( str, options ) {
		var this$1 = this;

		var items, item, lineStart = 0;

		this.str = str;
		this.options = options || {};
		this.pos = 0;

		this.lines = this.str.split( '\n' );
		this.lineEnds = this.lines.map( function ( line ) {
			var lineEnd = lineStart + line.length + 1; // +1 for the newline

			lineStart = lineEnd;
			return lineEnd;
		}, 0 );

		// Custom init logic
		if ( this.init ) this.init( str, options );

		items = [];

		while ( ( this$1.pos < this$1.str.length ) && ( item = this$1.read() ) ) {
			items.push( item );
		}

		this.leftover = this.remaining();
		this.result = this.postProcess ? this.postProcess( items, options ) : items;
	};

	Parser.prototype = {
		read: function ( converters ) {
			var this$1 = this;

			var pos, i, len, item;

			if ( !converters ) converters = this.converters;

			pos = this.pos;

			len = converters.length;
			for ( i = 0; i < len; i += 1 ) {
				this$1.pos = pos; // reset for each attempt

				if ( item = converters[i]( this$1 ) ) {
					return item;
				}
			}

			return null;
		},

		getContextMessage: function ( pos, message ) {
			var ref = this.getLinePos( pos ), lineNum = ref[0], columnNum = ref[1];
			if ( this.options.contextLines === -1 ) {
				return [ lineNum, columnNum, ("" + message + " at line " + lineNum + " character " + columnNum) ];
			}

			var line = this.lines[ lineNum - 1 ];

			var contextUp = '';
			var contextDown = '';
			if ( this.options.contextLines ) {
				var start = lineNum - 1 - this.options.contextLines < 0 ? 0 : lineNum - 1 - this.options.contextLines;
				contextUp = this.lines.slice( start, lineNum - 1 - start ).join( '\n' ).replace( /\t/g, '  ' );
				contextDown = this.lines.slice( lineNum, lineNum + this.options.contextLines ).join( '\n' ).replace( /\t/g, '  ' );
				if ( contextUp ) {
					contextUp += '\n';
				}
				if ( contextDown ) {
					contextDown = '\n' + contextDown;
				}
			}

			var numTabs = 0;
			var annotation = contextUp + line.replace( /\t/g, function ( match, char ) {
				if ( char < columnNum ) {
					numTabs += 1;
				}

				return '  ';
			}) + '\n' + new Array( columnNum + numTabs ).join( ' ' ) + '^----' + contextDown;

			return [ lineNum, columnNum, ("" + message + " at line " + lineNum + " character " + columnNum + ":\n" + annotation) ];
		},

		getLinePos: function ( char ) {
			var this$1 = this;

			var lineNum = 0, lineStart = 0, columnNum;

			while ( char >= this$1.lineEnds[ lineNum ] ) {
				lineStart = this$1.lineEnds[ lineNum ];
				lineNum += 1;
			}

			columnNum = char - lineStart;
			return [ lineNum + 1, columnNum + 1, char ]; // line/col should be one-based, not zero-based!
		},

		error: function ( message ) {
			var ref = this.getContextMessage( this.pos, message ), lineNum = ref[0], columnNum = ref[1], msg = ref[2];

			var error = new ParseError( msg );

			error.line = lineNum;
			error.character = columnNum;
			error.shortMessage = message;

			throw error;
		},

		matchString: function ( string ) {
			if ( this.str.substr( this.pos, string.length ) === string ) {
				this.pos += string.length;
				return string;
			}
		},

		matchPattern: function ( pattern ) {
			var match;

			if ( match = pattern.exec( this.remaining() ) ) {
				this.pos += match[0].length;
				return match[1] || match[0];
			}
		},

		allowWhitespace: function () {
			this.matchPattern( leadingWhitespace );
		},

		remaining: function () {
			return this.str.substring( this.pos );
		},

		nextChar: function () {
			return this.str.charAt( this.pos );
		}
	};

	Parser.extend = function ( proto ) {
		var Parent = this, Child, key;

		Child = function ( str, options ) {
			Parser.call( this, str, options );
		};

		Child.prototype = create( Parent.prototype );

		for ( key in proto ) {
			if ( hasOwn.call( proto, key ) ) {
				Child.prototype[ key ] = proto[ key ];
			}
		}

		Child.extend = Parser.extend;
		return Child;
	};

	var Parser$1 = Parser;

	var TEXT              = 1;
	var INTERPOLATOR      = 2;
	var TRIPLE            = 3;
	var SECTION           = 4;
	var INVERTED          = 5;
	var CLOSING           = 6;
	var ELEMENT           = 7;
	var PARTIAL           = 8;
	var COMMENT           = 9;
	var DELIMCHANGE       = 10;
	var ATTRIBUTE         = 13;
	var CLOSING_TAG       = 14;
	var COMPONENT         = 15;
	var YIELDER           = 16;
	var INLINE_PARTIAL    = 17;
	var DOCTYPE           = 18;
	var ALIAS             = 19;

	var NUMBER_LITERAL    = 20;
	var STRING_LITERAL    = 21;
	var ARRAY_LITERAL     = 22;
	var OBJECT_LITERAL    = 23;
	var BOOLEAN_LITERAL   = 24;
	var REGEXP_LITERAL    = 25;

	var GLOBAL            = 26;
	var KEY_VALUE_PAIR    = 27;


	var REFERENCE         = 30;
	var REFINEMENT        = 31;
	var MEMBER            = 32;
	var PREFIX_OPERATOR   = 33;
	var BRACKETED         = 34;
	var CONDITIONAL       = 35;
	var INFIX_OPERATOR    = 36;

	var INVOCATION        = 40;

	var SECTION_IF        = 50;
	var SECTION_UNLESS    = 51;
	var SECTION_EACH      = 52;
	var SECTION_WITH      = 53;
	var SECTION_IF_WITH   = 54;

	var ELSE              = 60;
	var ELSEIF            = 61;

	var EVENT             = 70;
	var DECORATOR         = 71;
	var TRANSITION        = 72;
	var BINDING_FLAG      = 73;

	var delimiterChangePattern = /^[^\s=]+/;
	var whitespacePattern = /^\s+/;
	function readDelimiterChange ( parser ) {
		var start, opening, closing;

		if ( !parser.matchString( '=' ) ) {
			return null;
		}

		start = parser.pos;

		// allow whitespace before new opening delimiter
		parser.allowWhitespace();

		opening = parser.matchPattern( delimiterChangePattern );
		if ( !opening ) {
			parser.pos = start;
			return null;
		}

		// allow whitespace (in fact, it's necessary...)
		if ( !parser.matchPattern( whitespacePattern ) ) {
			return null;
		}

		closing = parser.matchPattern( delimiterChangePattern );
		if ( !closing ) {
			parser.pos = start;
			return null;
		}

		// allow whitespace before closing '='
		parser.allowWhitespace();

		if ( !parser.matchString( '=' ) ) {
			parser.pos = start;
			return null;
		}

		return [ opening, closing ];
	}

	var regexpPattern = /^(\/(?:[^\n\r\u2028\u2029/\\[]|\\.|\[(?:[^\n\r\u2028\u2029\]\\]|\\.)*])+\/(?:([gimuy])(?![a-z]*\2))*(?![a-zA-Z_$0-9]))/;

	function readNumberLiteral ( parser ) {
		var result;

		if ( result = parser.matchPattern( regexpPattern ) ) {
			return {
				t: REGEXP_LITERAL,
				v: result
			};
		}

		return null;
	}

	var pattern$1 = /[-/\\^$*+?.()|[\]{}]/g;

	function escapeRegExp ( str ) {
		return str.replace( pattern$1, '\\$&' );
	}

	var regExpCache = {};

	function getLowestIndex ( haystack, needles ) {
		return haystack.search( regExpCache[needles.join()] || ( regExpCache[needles.join()] = new RegExp( needles.map( escapeRegExp ).join( '|' ) ) ) );
	}

	// https://github.com/kangax/html-minifier/issues/63#issuecomment-37763316
	var booleanAttributes = /^(allowFullscreen|async|autofocus|autoplay|checked|compact|controls|declare|default|defaultChecked|defaultMuted|defaultSelected|defer|disabled|enabled|formNoValidate|hidden|indeterminate|inert|isMap|itemScope|loop|multiple|muted|noHref|noResize|noShade|noValidate|noWrap|open|pauseOnExit|readOnly|required|reversed|scoped|seamless|selected|sortable|translate|trueSpeed|typeMustMatch|visible)$/i;
	var voidElementNames = /^(?:area|base|br|col|command|doctype|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;

	var htmlEntities = { quot: 34, amp: 38, apos: 39, lt: 60, gt: 62, nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, sect: 167, uml: 168, copy: 169, ordf: 170, laquo: 171, not: 172, shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190, iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221, THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251, uuml: 252, yacute: 253, thorn: 254, yuml: 255, OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732, Alpha: 913, Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919, Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925, Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932, Upsilon: 933, Phi: 934, Chi: 935, Psi: 936, Omega: 937, alpha: 945, beta: 946, gamma: 947, delta: 948, epsilon: 949, zeta: 950, eta: 951, theta: 952, iota: 953, kappa: 954, lambda: 955, mu: 956, nu: 957, xi: 958, omicron: 959, pi: 960, rho: 961, sigmaf: 962, sigma: 963, tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968, omega: 969, thetasym: 977, upsih: 978, piv: 982, ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240, prime: 8242, Prime: 8243, lsaquo: 8249, rsaquo: 8250, oline: 8254, frasl: 8260, euro: 8364, image: 8465, weierp: 8472, real: 8476, trade: 8482, alefsym: 8501, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659, hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711, isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721, minus: 8722, lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736, and: 8743, or: 8744, cap: 8745, cup: 8746, 'int': 8747, there4: 8756, sim: 8764, cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805, sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853, otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970, rfloor: 8971, lang: 9001, rang: 9002, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830	};
	var controlCharacters = [ 8364, 129, 8218, 402, 8222, 8230, 8224, 8225, 710, 8240, 352, 8249, 338, 141, 381, 143, 144, 8216, 8217, 8220, 8221, 8226, 8211, 8212, 732, 8482, 353, 8250, 339, 157, 382, 376 ];
	var entityPattern = new RegExp( '&(#?(?:x[\\w\\d]+|\\d+|' + Object.keys( htmlEntities ).join( '|' ) + '));?', 'g' );
	var codePointSupport = typeof String.fromCodePoint === 'function';
	var codeToChar = codePointSupport ? String.fromCodePoint : String.fromCharCode;

	function decodeCharacterReferences ( html ) {
		return html.replace( entityPattern, function ( match, entity ) {
			var code;

			// Handle named entities
			if ( entity[0] !== '#' ) {
				code = htmlEntities[ entity ];
			} else if ( entity[1] === 'x' ) {
				code = parseInt( entity.substring( 2 ), 16 );
			} else {
				code = parseInt( entity.substring( 1 ), 10 );
			}

			if ( !code ) {
				return match;
			}

			return codeToChar( validateCode( code ) );
		});
	}

	var lessThan = /</g;
	var greaterThan = />/g;
	var amp = /&/g;
	var invalid = 65533;

	function escapeHtml ( str ) {
		return str
			.replace( amp, '&amp;' )
			.replace( lessThan, '&lt;' )
			.replace( greaterThan, '&gt;' );
	}

	// some code points are verboten. If we were inserting HTML, the browser would replace the illegal
	// code points with alternatives in some cases - since we're bypassing that mechanism, we need
	// to replace them ourselves
	//
	// Source: http://en.wikipedia.org/wiki/Character_encodings_in_HTML#Illegal_characters
	function validateCode ( code ) {
		if ( !code ) {
			return invalid;
		}

		// line feed becomes generic whitespace
		if ( code === 10 ) {
			return 32;
		}

		// ASCII range. (Why someone would use HTML entities for ASCII characters I don't know, but...)
		if ( code < 128 ) {
			return code;
		}

		// code points 128-159 are dealt with leniently by browsers, but they're incorrect. We need
		// to correct the mistake or we'll end up with missing € signs and so on
		if ( code <= 159 ) {
			return controlCharacters[ code - 128 ];
		}

		// basic multilingual plane
		if ( code < 55296 ) {
			return code;
		}

		// UTF-16 surrogate halves
		if ( code <= 57343 ) {
			return invalid;
		}

		// rest of the basic multilingual plane
		if ( code <= 65535 ) {
			return code;
		} else if ( !codePointSupport ) {
			return invalid;
		}

		// supplementary multilingual plane 0x10000 - 0x1ffff
		if ( code >= 65536 && code <= 131071 ) {
			return code;
		}

		// supplementary ideographic plane 0x20000 - 0x2ffff
		if ( code >= 131072 && code <= 196607 ) {
			return code;
		}

		return invalid;
	}

	var expectedExpression = 'Expected a JavaScript expression';
	var expectedParen = 'Expected closing paren';

	// bulletproof number regex from https://gist.github.com/Rich-Harris/7544330
	var numberPattern = /^(?:[+-]?)0*(?:(?:(?:[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;

	function readNumberLiteral$1 ( parser ) {
		var result;

		if ( result = parser.matchPattern( numberPattern ) ) {
			return {
				t: NUMBER_LITERAL,
				v: result
			};
		}

		return null;
	}

	function readBooleanLiteral ( parser ) {
		var remaining = parser.remaining();

		if ( remaining.substr( 0, 4 ) === 'true' ) {
			parser.pos += 4;
			return {
				t: BOOLEAN_LITERAL,
				v: 'true'
			};
		}

		if ( remaining.substr( 0, 5 ) === 'false' ) {
			parser.pos += 5;
			return {
				t: BOOLEAN_LITERAL,
				v: 'false'
			};
		}

		return null;
	}

	var stringMiddlePattern;
	var escapeSequencePattern;
	var lineContinuationPattern;
	// Match one or more characters until: ", ', \, or EOL/EOF.
	// EOL/EOF is written as (?!.) (meaning there's no non-newline char next).
	stringMiddlePattern = /^(?=.)[^"'\\]+?(?:(?!.)|(?=["'\\]))/;

	// Match one escape sequence, including the backslash.
	escapeSequencePattern = /^\\(?:['"\\bfnrt]|0(?![0-9])|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|(?=.)[^ux0-9])/;

	// Match one ES5 line continuation (backslash + line terminator).
	lineContinuationPattern = /^\\(?:\r\n|[\u000A\u000D\u2028\u2029])/;

	// Helper for defining getDoubleQuotedString and getSingleQuotedString.
	function makeQuotedStringMatcher ( okQuote ) {
		return function ( parser ) {
			var literal = '"';
			var done = false;
			var next;

			while ( !done ) {
				next = ( parser.matchPattern( stringMiddlePattern ) || parser.matchPattern( escapeSequencePattern ) ||
					parser.matchString( okQuote ) );
				if ( next ) {
					if ( next === ("\"") ) {
						literal += "\\\"";
					} else if ( next === ("\\'") ) {
						literal += "'";
					} else {
						literal += next;
					}
				} else {
					next = parser.matchPattern( lineContinuationPattern );
					if ( next ) {
						// convert \(newline-like) into a \u escape, which is allowed in JSON
						literal += '\\u' + ( '000' + next.charCodeAt(1).toString(16) ).slice( -4 );
					} else {
						done = true;
					}
				}
			}

			literal += '"';

			// use JSON.parse to interpret escapes
			return JSON.parse( literal );
		};
	}

	var getSingleQuotedString = makeQuotedStringMatcher( ("\"") );
	var getDoubleQuotedString = makeQuotedStringMatcher( ("'") );

	function readStringLiteral ( parser ) {
		var start, string;

		start = parser.pos;

		if ( parser.matchString( '"' ) ) {
			string = getDoubleQuotedString( parser );

			if ( !parser.matchString( '"' ) ) {
				parser.pos = start;
				return null;
			}

			return {
				t: STRING_LITERAL,
				v: string
			};
		}

		if ( parser.matchString( ("'") ) ) {
			string = getSingleQuotedString( parser );

			if ( !parser.matchString( ("'") ) ) {
				parser.pos = start;
				return null;
			}

			return {
				t: STRING_LITERAL,
				v: string
			};
		}

		return null;
	}

	var namePattern = /^[a-zA-Z_$][a-zA-Z_$0-9]*/;

	var identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

	// http://mathiasbynens.be/notes/javascript-properties
	// can be any name, string literal, or number literal
	function readKey ( parser ) {
		var token;

		if ( token = readStringLiteral( parser ) ) {
			return identifier.test( token.v ) ? token.v : '"' + token.v.replace( /"/g, '\\"' ) + '"';
		}

		if ( token = readNumberLiteral$1( parser ) ) {
			return token.v;
		}

		if ( token = parser.matchPattern( namePattern ) ) {
			return token;
		}

		return null;
	}

	function readKeyValuePair ( parser ) {
		var start, key, value;

		start = parser.pos;

		// allow whitespace between '{' and key
		parser.allowWhitespace();

		var refKey = parser.nextChar() !== '\'' && parser.nextChar() !== '"';

		key = readKey( parser );
		if ( key === null ) {
			parser.pos = start;
			return null;
		}

		// allow whitespace between key and ':'
		parser.allowWhitespace();

		// es2015 shorthand property
		if ( refKey && ( parser.nextChar() === ',' || parser.nextChar() === '}' ) ) {
			if ( !namePattern.test( key ) ) {
				parser.error( ("Expected a valid reference, but found '" + key + "' instead.") );
			}

			return {
				t: KEY_VALUE_PAIR,
				k: key,
				v: {
					t: REFERENCE,
					n: key
				}
			};
		}

		// next character must be ':'
		if ( !parser.matchString( ':' ) ) {
			parser.pos = start;
			return null;
		}

		// allow whitespace between ':' and value
		parser.allowWhitespace();

		// next expression must be a, well... expression
		value = readExpression( parser );
		if ( value === null ) {
			parser.pos = start;
			return null;
		}

		return {
			t: KEY_VALUE_PAIR,
			k: key,
			v: value
		};
	}

	function readKeyValuePairs ( parser ) {
		var start, pairs, pair, keyValuePairs;

		start = parser.pos;

		pair = readKeyValuePair( parser );
		if ( pair === null ) {
			return null;
		}

		pairs = [ pair ];

		if ( parser.matchString( ',' ) ) {
			keyValuePairs = readKeyValuePairs( parser );

			if ( !keyValuePairs ) {
				parser.pos = start;
				return null;
			}

			return pairs.concat( keyValuePairs );
		}

		return pairs;
	}

	function readObjectLiteral ( parser ) {
		var start, keyValuePairs;

		start = parser.pos;

		// allow whitespace
		parser.allowWhitespace();

		if ( !parser.matchString( '{' ) ) {
			parser.pos = start;
			return null;
		}

		keyValuePairs = readKeyValuePairs( parser );

		// allow whitespace between final value and '}'
		parser.allowWhitespace();

		if ( !parser.matchString( '}' ) ) {
			parser.pos = start;
			return null;
		}

		return {
			t: OBJECT_LITERAL,
			m: keyValuePairs
		};
	}

	function readExpressionList ( parser ) {
		parser.allowWhitespace();

		var expr = readExpression( parser );

		if ( expr === null ) return null;

		var expressions = [ expr ];

		// allow whitespace between expression and ','
		parser.allowWhitespace();

		if ( parser.matchString( ',' ) ) {
			var next = readExpressionList( parser );
			if ( next === null ) parser.error( expectedExpression );

			expressions.push.apply( expressions, next );
		}

		return expressions;
	}

	function readArrayLiteral ( parser ) {
		var start, expressionList;

		start = parser.pos;

		// allow whitespace before '['
		parser.allowWhitespace();

		if ( !parser.matchString( '[' ) ) {
			parser.pos = start;
			return null;
		}

		expressionList = readExpressionList( parser );

		if ( !parser.matchString( ']' ) ) {
			parser.pos = start;
			return null;
		}

		return {
			t: ARRAY_LITERAL,
			m: expressionList
		};
	}

	function readLiteral ( parser ) {
		return readNumberLiteral$1( parser )  ||
		       readBooleanLiteral( parser ) ||
		       readStringLiteral( parser )  ||
		       readObjectLiteral( parser )  ||
		       readArrayLiteral( parser )   ||
		       readNumberLiteral( parser );
	}

	var prefixPattern = /^(?:~\/|(?:\.\.\/)+|\.\/(?:\.\.\/)*|\.)/;
	var globals;
	var keywords;
	// if a reference is a browser global, we don't deference it later, so it needs special treatment
	globals = /^(?:Array|console|Date|RegExp|decodeURIComponent|decodeURI|encodeURIComponent|encodeURI|isFinite|isNaN|parseFloat|parseInt|JSON|Math|NaN|undefined|null|Object|Number|String|Boolean)\b/;

	// keywords are not valid references, with the exception of `this`
	keywords = /^(?:break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with)$/;

	var legalReference = /^(?:[a-zA-Z$_0-9]|\\\.)+(?:(?:\.(?:[a-zA-Z$_0-9]|\\\.)+)|(?:\[[0-9]+\]))*/;
	var relaxedName = /^[a-zA-Z_$][-\/a-zA-Z_$0-9]*/;
	var specials = /^@(?:keypath|rootpath|index|key|this|global)/;
	var specialCall = /^\s*\(/;
	var spreadPattern = /^\s*\.{3}/;

	function readReference ( parser ) {
		var startPos, prefix, name, global, reference, fullLength, lastDotIndex, spread;

		startPos = parser.pos;

		name = parser.matchPattern( specials );

		if ( name === '@keypath' || name === '@rootpath' ) {
			if ( parser.matchPattern( specialCall ) ) {
				var ref = readReference( parser );
				if ( !ref ) parser.error( ("Expected a valid reference for a keypath expression") );

				parser.allowWhitespace();

				if ( !parser.matchString( ')' ) ) parser.error( ("Unclosed keypath expression") );
				name += "(" + (ref.n) + ")";
			}
		}

		spread = !name && parser.spreadArgs && parser.matchPattern( spreadPattern );

		if ( !name ) {
			prefix = parser.matchPattern( prefixPattern ) || '';
			name = ( !prefix && parser.relaxedNames && parser.matchPattern( relaxedName ) ) ||
			       parser.matchPattern( legalReference );

			if ( !name && prefix === '.' ) {
				prefix = '';
				name = '.';
			} else if ( !name && prefix ) {
				name = prefix;
				prefix = '';
			}
		}

		if ( !name ) {
			return null;
		}

		// bug out if it's a keyword (exception for ancestor/restricted refs - see https://github.com/ractivejs/ractive/issues/1497)
		if ( !prefix && !parser.relaxedNames && keywords.test( name ) ) {
			parser.pos = startPos;
			return null;
		}

		// if this is a browser global, stop here
		if ( !prefix && globals.test( name ) ) {
			global = globals.exec( name )[0];
			parser.pos = startPos + global.length;

			return {
				t: GLOBAL,
				v: ( spread ? '...' : '' ) + global
			};
		}

		fullLength = ( spread ? 3 : 0 ) + ( prefix || '' ).length + name.length;
		reference = ( prefix || '' ) + normalise( name );

		if ( parser.matchString( '(' ) ) {
			// if this is a method invocation (as opposed to a function) we need
			// to strip the method name from the reference combo, else the context
			// will be wrong
			// but only if the reference was actually a member and not a refinement
			lastDotIndex = reference.lastIndexOf( '.' );
			if ( lastDotIndex !== -1 && name[ name.length - 1 ] !== ']' ) {
				var refLength = reference.length;
				reference = reference.substr( 0, lastDotIndex );
				parser.pos = startPos + (fullLength - ( refLength - lastDotIndex ) );
			} else {
				parser.pos -= 1;
			}
		}

		return {
			t: REFERENCE,
			n: ( spread ? '...' : '' ) + reference.replace( /^this\./, './' ).replace( /^this$/, '.' )
		};
	}

	function readBracketedExpression ( parser ) {
		if ( !parser.matchString( '(' ) ) return null;

		parser.allowWhitespace();

		var expr = readExpression( parser );

		if ( !expr ) parser.error( expectedExpression );

		parser.allowWhitespace();

		if ( !parser.matchString( ')' ) ) parser.error( expectedParen );

		return {
			t: BRACKETED,
			x: expr
		};
	}

	function readPrimary ( parser ) {
		return readLiteral( parser )
			|| readReference( parser )
			|| readBracketedExpression( parser );
	}

	function readRefinement ( parser ) {
		// some things call for strict refinement (partial names), meaning no space between reference and refinement
		if ( !parser.strictRefinement ) {
			parser.allowWhitespace();
		}

		// "." name
		if ( parser.matchString( '.' ) ) {
			parser.allowWhitespace();

			var name = parser.matchPattern( namePattern );
			if ( name ) {
				return {
					t: REFINEMENT,
					n: name
				};
			}

			parser.error( 'Expected a property name' );
		}

		// "[" expression "]"
		if ( parser.matchString( '[' ) ) {
			parser.allowWhitespace();

			var expr = readExpression( parser );
			if ( !expr ) parser.error( expectedExpression );

			parser.allowWhitespace();

			if ( !parser.matchString( ']' ) ) parser.error( ("Expected ']'") );

			return {
				t: REFINEMENT,
				x: expr
			};
		}

		return null;
	}

	function readMemberOrInvocation ( parser ) {
		var expression = readPrimary( parser );

		if ( !expression ) return null;

		while ( expression ) {
			var refinement = readRefinement( parser );
			if ( refinement ) {
				expression = {
					t: MEMBER,
					x: expression,
					r: refinement
				};
			}

			else if ( parser.matchString( '(' ) ) {
				parser.allowWhitespace();
				var start = parser.spreadArgs;
				parser.spreadArgs = true;
				var expressionList = readExpressionList( parser );
				parser.spreadArgs = start;

				parser.allowWhitespace();

				if ( !parser.matchString( ')' ) ) {
					parser.error( expectedParen );
				}

				expression = {
					t: INVOCATION,
					x: expression
				};

				if ( expressionList ) expression.o = expressionList;
			}

			else {
				break;
			}
		}

		return expression;
	}

	var readTypeOf;
	var makePrefixSequenceMatcher;
	makePrefixSequenceMatcher = function ( symbol, fallthrough ) {
		return function ( parser ) {
			var expression;

			if ( expression = fallthrough( parser ) ) {
				return expression;
			}

			if ( !parser.matchString( symbol ) ) {
				return null;
			}

			parser.allowWhitespace();

			expression = readExpression( parser );
			if ( !expression ) {
				parser.error( expectedExpression );
			}

			return {
				s: symbol,
				o: expression,
				t: PREFIX_OPERATOR
			};
		};
	};

	// create all prefix sequence matchers, return readTypeOf
	(function() {
		var i, len, matcher, prefixOperators, fallthrough;

		prefixOperators = '! ~ + - typeof'.split( ' ' );

		fallthrough = readMemberOrInvocation;
		for ( i = 0, len = prefixOperators.length; i < len; i += 1 ) {
			matcher = makePrefixSequenceMatcher( prefixOperators[i], fallthrough );
			fallthrough = matcher;
		}

		// typeof operator is higher precedence than multiplication, so provides the
		// fallthrough for the multiplication sequence matcher we're about to create
		// (we're skipping void and delete)
		readTypeOf = fallthrough;
	}());

	var readTypeof = readTypeOf;

	var readLogicalOr;
	var makeInfixSequenceMatcher;
	makeInfixSequenceMatcher = function ( symbol, fallthrough ) {
		return function ( parser ) {
			var start, left, right;

			left = fallthrough( parser );
			if ( !left ) {
				return null;
			}

			// Loop to handle left-recursion in a case like `a * b * c` and produce
			// left association, i.e. `(a * b) * c`.  The matcher can't call itself
			// to parse `left` because that would be infinite regress.
			while ( true ) {
				start = parser.pos;

				parser.allowWhitespace();

				if ( !parser.matchString( symbol ) ) {
					parser.pos = start;
					return left;
				}

				// special case - in operator must not be followed by [a-zA-Z_$0-9]
				if ( symbol === 'in' && /[a-zA-Z_$0-9]/.test( parser.remaining().charAt( 0 ) ) ) {
					parser.pos = start;
					return left;
				}

				parser.allowWhitespace();

				// right operand must also consist of only higher-precedence operators
				right = fallthrough( parser );
				if ( !right ) {
					parser.pos = start;
					return left;
				}

				left = {
					t: INFIX_OPERATOR,
					s: symbol,
					o: [ left, right ]
				};

				// Loop back around.  If we don't see another occurrence of the symbol,
				// we'll return left.
			}
		};
	};

	// create all infix sequence matchers, and return readLogicalOr
	(function() {
		var i, len, matcher, infixOperators, fallthrough;

		// All the infix operators on order of precedence (source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Operator_Precedence)
		// Each sequence matcher will initially fall through to its higher precedence
		// neighbour, and only attempt to match if one of the higher precedence operators
		// (or, ultimately, a literal, reference, or bracketed expression) already matched
		infixOperators = '* / % + - << >> >>> < <= > >= in instanceof == != === !== & ^ | && ||'.split( ' ' );

		// A typeof operator is higher precedence than multiplication
		fallthrough = readTypeof;
		for ( i = 0, len = infixOperators.length; i < len; i += 1 ) {
			matcher = makeInfixSequenceMatcher( infixOperators[i], fallthrough );
			fallthrough = matcher;
		}

		// Logical OR is the fallthrough for the conditional matcher
		readLogicalOr = fallthrough;
	}());

	var readLogicalOr$1 = readLogicalOr;

	// The conditional operator is the lowest precedence operator, so we start here
	function getConditional ( parser ) {
		var start, expression, ifTrue, ifFalse;

		expression = readLogicalOr$1( parser );
		if ( !expression ) {
			return null;
		}

		start = parser.pos;

		parser.allowWhitespace();

		if ( !parser.matchString( '?' ) ) {
			parser.pos = start;
			return expression;
		}

		parser.allowWhitespace();

		ifTrue = readExpression( parser );
		if ( !ifTrue ) {
			parser.error( expectedExpression );
		}

		parser.allowWhitespace();

		if ( !parser.matchString( ':' ) ) {
			parser.error( 'Expected ":"' );
		}

		parser.allowWhitespace();

		ifFalse = readExpression( parser );
		if ( !ifFalse ) {
			parser.error( expectedExpression );
		}

		return {
			t: CONDITIONAL,
			o: [ expression, ifTrue, ifFalse ]
		};
	}

	function readExpression ( parser ) {
		// The conditional operator is the lowest precedence operator (except yield,
		// assignment operators, and commas, none of which are supported), so we
		// start there. If it doesn't match, it 'falls through' to progressively
		// higher precedence operators, until it eventually matches (or fails to
		// match) a 'primary' - a literal or a reference. This way, the abstract syntax
		// tree has everything in its proper place, i.e. 2 + 3 * 4 === 14, not 20.
		return getConditional( parser );
	}

	function flattenExpression ( expression ) {
		var refs, count = 0, stringified;

		extractRefs( expression, refs = [] );
		stringified = stringify( expression );

		refs = refs.map( function ( r ) { return r.indexOf( '...' ) === 0 ? r.substr( 3 ) : r; } );

		return {
			r: refs,
			s: getVars(stringified)
		};

		function getVars(expr) {
			var vars = [];
			for ( var i = count - 1; i >= 0; i-- ) {
				vars.push( ("spread$" + i) );
			}
			return vars.length ? ("(function(){var " + (vars.join(',')) + ";return(" + expr + ");})()") : expr;
		}

		function stringify ( node ) {
			switch ( node.t ) {
				case BOOLEAN_LITERAL:
				case GLOBAL:
				case NUMBER_LITERAL:
				case REGEXP_LITERAL:
					return node.v;

				case STRING_LITERAL:
					return JSON.stringify( String( node.v ) );

				case ARRAY_LITERAL:
					return '[' + ( node.m ? node.m.map( stringify ).join( ',' ) : '' ) + ']';

				case OBJECT_LITERAL:
					return '{' + ( node.m ? node.m.map( stringify ).join( ',' ) : '' ) + '}';

				case KEY_VALUE_PAIR:
					return node.k + ':' + stringify( node.v );

				case PREFIX_OPERATOR:
					return ( node.s === 'typeof' ? 'typeof ' : node.s ) + stringify( node.o );

				case INFIX_OPERATOR:
					return stringify( node.o[0] ) + ( node.s.substr( 0, 2 ) === 'in' ? ' ' + node.s + ' ' : node.s ) + stringify( node.o[1] );

				case INVOCATION:
					if ( node.spread ) {
						var id = count++;
						return ("(spread$" + id + " = " + (stringify(node.x)) + ").apply(spread$" + id + ", [].concat(" + (node.o ? node.o.map( function ( a ) { return a.n && a.n.indexOf( '...' ) === 0 ? stringify( a ) : '[' + stringify(a) + ']'; } ).join( ',' ) : '') + ") )");
					} else {
						return stringify( node.x ) + '(' + ( node.o ? node.o.map( stringify ).join( ',' ) : '' ) + ')';
					}

				case BRACKETED:
					return '(' + stringify( node.x ) + ')';

				case MEMBER:
					return stringify( node.x ) + stringify( node.r );

				case REFINEMENT:
					return ( node.n ? '.' + node.n : '[' + stringify( node.x ) + ']' );

				case CONDITIONAL:
					return stringify( node.o[0] ) + '?' + stringify( node.o[1] ) + ':' + stringify( node.o[2] );

				case REFERENCE:
					return '_' + refs.indexOf( node.n );

				default:
					throw new Error( 'Expected legal JavaScript' );
			}
		}
	}

	// TODO maybe refactor this?
	function extractRefs ( node, refs ) {
		var i, list;

		if ( node.t === REFERENCE ) {
			if ( refs.indexOf( node.n ) === -1 ) {
				refs.unshift( node.n );
			}
		}

		list = node.o || node.m;
		if ( list ) {
			if ( isObject( list ) ) {
				extractRefs( list, refs );
			} else {
				i = list.length;
				while ( i-- ) {
					if ( list[i].n && list[i].n.indexOf('...') === 0 ) {
						node.spread = true;
					}
					extractRefs( list[i], refs );
				}
			}
		}

		if ( node.x ) {
			extractRefs( node.x, refs );
		}

		if ( node.r ) {
			extractRefs( node.r, refs );
		}

		if ( node.v ) {
			extractRefs( node.v, refs );
		}
	}

	// simple JSON parser, without the restrictions of JSON parse
	// (i.e. having to double-quote keys).
	//
	// If passed a hash of values as the second argument, ${placeholders}
	// will be replaced with those values

	var specials$1 = {
		'true': true,
		'false': false,
		'null': null,
		undefined: undefined
	};

	var specialsPattern = new RegExp( '^(?:' + Object.keys( specials$1 ).join( '|' ) + ')' );
	var numberPattern$1 = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
	var placeholderPattern = /\$\{([^\}]+)\}/g;
	var placeholderAtStartPattern = /^\$\{([^\}]+)\}/;
	var onlyWhitespace = /^\s*$/;

	var JsonParser = Parser$1.extend({
		init: function ( str, options ) {
			this.values = options.values;
			this.allowWhitespace();
		},

		postProcess: function ( result ) {
			if ( result.length !== 1 || !onlyWhitespace.test( this.leftover ) ) {
				return null;
			}

			return { value: result[0].v };
		},

		converters: [
			function getPlaceholder ( parser ) {
				if ( !parser.values ) return null;

				var placeholder = parser.matchPattern( placeholderAtStartPattern );

				if ( placeholder && ( parser.values.hasOwnProperty( placeholder ) ) ) {
					return { v: parser.values[ placeholder ] };
				}
			},

			function getSpecial ( parser ) {
				var special = parser.matchPattern( specialsPattern );
				if ( special ) return { v: specials$1[ special ] };
			},

			function getNumber ( parser ) {
				var number = parser.matchPattern( numberPattern$1 );
				if ( number ) return { v: +number };
			},

			function getString ( parser ) {
				var stringLiteral = readStringLiteral( parser );
				var values = parser.values;

				if ( stringLiteral && values ) {
					return {
						v: stringLiteral.v.replace( placeholderPattern, function ( match, $1 ) { return ( $1 in values ? values[ $1 ] : $1 ); } )
					};
				}

				return stringLiteral;
			},

			function getObject ( parser ) {
				if ( !parser.matchString( '{' ) ) return null;

				var result = {};

				parser.allowWhitespace();

				if ( parser.matchString( '}' ) ) {
					return { v: result };
				}

				var pair;
				while ( pair = getKeyValuePair( parser ) ) {
					result[ pair.key ] = pair.value;

					parser.allowWhitespace();

					if ( parser.matchString( '}' ) ) {
						return { v: result };
					}

					if ( !parser.matchString( ',' ) ) {
						return null;
					}
				}

				return null;
			},

			function getArray ( parser ) {
				if ( !parser.matchString( '[' ) ) return null;

				var result = [];

				parser.allowWhitespace();

				if ( parser.matchString( ']' ) ) {
					return { v: result };
				}

				var valueToken;
				while ( valueToken = parser.read() ) {
					result.push( valueToken.v );

					parser.allowWhitespace();

					if ( parser.matchString( ']' ) ) {
						return { v: result };
					}

					if ( !parser.matchString( ',' ) ) {
						return null;
					}

					parser.allowWhitespace();
				}

				return null;
			}
		]
	});

	function getKeyValuePair ( parser ) {
		parser.allowWhitespace();

		var key = readKey( parser );

		if ( !key ) return null;

		var pair = { key: key };

		parser.allowWhitespace();
		if ( !parser.matchString( ':' ) ) {
			return null;
		}
		parser.allowWhitespace();

		var valueToken = parser.read();

		if ( !valueToken ) return null;

		pair.value = valueToken.v;
		return pair;
	}

	function parseJSON ( str, values ) {
		var parser = new JsonParser( str, { values: values });
		return parser.result;
	}

	var methodCallPattern = /^([a-zA-Z_$][a-zA-Z_$0-9]*)\(.*\)\s*$/;
	var ExpressionParser;
	ExpressionParser = Parser$1.extend({
		converters: [ readExpression ],
		spreadArgs: true
	});

	// TODO clean this up, it's shocking
	function processDirective ( tokens, parentParser, type ) {
		var result,
			match,
			token,
			colonIndex,
			directiveName,
			directiveArgs,
			parsed;

		if ( typeof tokens === 'string' ) {
			var pos = parentParser.pos - tokens.length;
			if ( type === DECORATOR || type === TRANSITION ) {
				var parser = new ExpressionParser( ("[" + tokens + "]") );
				return { a: flattenExpression( parser.result[0] ) };
			}

			if ( type === EVENT && ( match = methodCallPattern.exec( tokens ) ) ) {
				warnIfDebug( parentParser.getContextMessage( pos, ("Unqualified method events are deprecated. Prefix methods with '@this.' to call methods on the current Ractive instance.") )[2] );
				tokens = "@this." + (match[1]) + "" + (tokens.substr(match[1].length));
			}

			if ( type === EVENT && ~tokens.indexOf( '(' ) ) {
				var parser$1 = new ExpressionParser( '[' + tokens + ']' );
				if ( parser$1.result && parser$1.result[0] ) {
					if ( parser$1.remaining().length ) {
						parentParser.pos = pos + tokens.length - parser$1.remaining().length;
						parentParser.error( ("Invalid input after event expression '" + (parser$1.remaining()) + "'") );
					}
					return { x: flattenExpression( parser$1.result[0] ) };
				}

				if ( tokens.indexOf( ':' ) > tokens.indexOf( '(' ) || !~tokens.indexOf( ':' ) ) {
					parentParser.pos = pos;
					parentParser.error( ("Invalid input in event expression '" + tokens + "'") );
				}

			}

			if ( tokens.indexOf( ':' ) === -1 ) {
				return tokens.trim();
			}

			tokens = [ tokens ];
		}

		result = {};

		directiveName = [];
		directiveArgs = [];

		if ( tokens ) {
			while ( tokens.length ) {
				token = tokens.shift();

				if ( typeof token === 'string' ) {
					colonIndex = token.indexOf( ':' );

					if ( colonIndex === -1 ) {
						directiveName.push( token );
					} else {
						// is the colon the first character?
						if ( colonIndex ) {
							// no
							directiveName.push( token.substr( 0, colonIndex ) );
						}

						// if there is anything after the colon in this token, treat
						// it as the first token of the directiveArgs fragment
						if ( token.length > colonIndex + 1 ) {
							directiveArgs[0] = token.substring( colonIndex + 1 );
						}

						break;
					}
				}

				else {
					directiveName.push( token );
				}
			}

			directiveArgs = directiveArgs.concat( tokens );
		}

		if ( !directiveName.length ) {
			result = '';
		} else if ( directiveArgs.length || typeof directiveName !== 'string' ) {
			result = {
				// TODO is this really necessary? just use the array
				n: ( directiveName.length === 1 && typeof directiveName[0] === 'string' ? directiveName[0] : directiveName )
			};

			if ( directiveArgs.length === 1 && typeof directiveArgs[0] === 'string' ) {
				parsed = parseJSON( '[' + directiveArgs[0] + ']' );
				result.a = parsed ? parsed.value : [ directiveArgs[0].trim() ];
			}

			else {
				result.d = directiveArgs;
			}
		} else {
			result = directiveName;
		}

		if ( directiveArgs.length && type ) {
			warnIfDebug( parentParser.getContextMessage( parentParser.pos, ("Proxy events with arguments are deprecated. You can fire events with arguments using \"@this.fire('eventName', arg1, arg2, ...)\".") )[2] );
		}

		return result;
	}

	var attributeNamePattern = /^[^\s"'>\/=]+/;
	var onPattern = /^on/;
	var proxyEventPattern = /^on-([a-zA-Z\\*\\.$_][a-zA-Z\\*\\.$_0-9\-]+)$/;
	var reservedEventNames = /^(?:change|reset|teardown|update|construct|config|init|render|unrender|detach|insert)$/;
	var decoratorPattern = /^as-([a-z-A-Z][-a-zA-Z_0-9]*)$/;
	var transitionPattern = /^([a-zA-Z](?:(?!-in-out)[-a-zA-Z_0-9])*)-(in|out|in-out)$/;
	var directives = {
					   'intro-outro': { t: TRANSITION, v: 't0' },
					   intro: { t: TRANSITION, v: 't1' },
					   outro: { t: TRANSITION, v: 't2' },
					   lazy: { t: BINDING_FLAG, v: 'l' },
					   twoway: { t: BINDING_FLAG, v: 't' },
					   decorator: { t: DECORATOR }
					 };
	var unquotedAttributeValueTextPattern = /^[^\s"'=<>\/`]+/;
	function readAttribute ( parser ) {
		var attr, name, value, i, nearest, idx;

		parser.allowWhitespace();

		name = parser.matchPattern( attributeNamePattern );
		if ( !name ) {
			return null;
		}

		// check for accidental delimiter consumption e.g. <tag bool{{>attrs}} />
		nearest = name.length;
		for ( i = 0; i < parser.tags.length; i++ ) {
			if ( ~( idx = name.indexOf( parser.tags[ i ].open ) ) ) {
				if ( idx < nearest ) nearest = idx;
			}
		}
		if ( nearest < name.length ) {
			parser.pos -= name.length - nearest;
			name = name.substr( 0, nearest );
			if ( !name ) return null;
			else return { n: name };
		}

		attr = { n: name };

		value = readAttributeValue( parser );
		if ( value != null ) { // not null/undefined
			attr.f = value;
		}

		return attr;
	}

	function readAttributeValue ( parser ) {
		var start, valueStart, startDepth, value;

		start = parser.pos;

		// next character must be `=`, `/`, `>` or whitespace
		if ( !/[=\/>\s]/.test( parser.nextChar() ) ) {
			parser.error( 'Expected `=`, `/`, `>` or whitespace' );
		}

		parser.allowWhitespace();

		if ( !parser.matchString( '=' ) ) {
			parser.pos = start;
			return null;
		}

		parser.allowWhitespace();

		valueStart = parser.pos;
		startDepth = parser.sectionDepth;

		value = readQuotedAttributeValue( parser, ("'") ) ||
				readQuotedAttributeValue( parser, ("\"") ) ||
				readUnquotedAttributeValue( parser );

		if ( value === null ) {
			parser.error( 'Expected valid attribute value' );
		}

		if ( parser.sectionDepth !== startDepth ) {
			parser.pos = valueStart;
			parser.error( 'An attribute value must contain as many opening section tags as closing section tags' );
		}

		if ( !value.length ) {
			return '';
		}

		if ( value.length === 1 && typeof value[0] === 'string' ) {
			return decodeCharacterReferences( value[0] );
		}

		return value;
	}

	function readUnquotedAttributeValueToken ( parser ) {
		var start, text, haystack, needles, index;

		start = parser.pos;

		text = parser.matchPattern( unquotedAttributeValueTextPattern );

		if ( !text ) {
			return null;
		}

		haystack = text;
		needles = parser.tags.map( function ( t ) { return t.open; } ); // TODO refactor... we do this in readText.js as well

		if ( ( index = getLowestIndex( haystack, needles ) ) !== -1 ) {
			text = text.substr( 0, index );
			parser.pos = start + text.length;
		}

		return text;
	}

	function readUnquotedAttributeValue ( parser ) {
		var tokens, token;

		parser.inAttribute = true;

		tokens = [];

		token = readMustache( parser ) || readUnquotedAttributeValueToken( parser );
		while ( token ) {
			tokens.push( token );
			token = readMustache( parser ) || readUnquotedAttributeValueToken( parser );
		}

		if ( !tokens.length ) {
			return null;
		}

		parser.inAttribute = false;
		return tokens;
	}

	function readQuotedAttributeValue ( parser, quoteMark ) {
		var start, tokens, token;

		start = parser.pos;

		if ( !parser.matchString( quoteMark ) ) {
			return null;
		}

		parser.inAttribute = quoteMark;

		tokens = [];

		token = readMustache( parser ) || readQuotedStringToken( parser, quoteMark );
		while ( token !== null ) {
			tokens.push( token );
			token = readMustache( parser ) || readQuotedStringToken( parser, quoteMark );
		}

		if ( !parser.matchString( quoteMark ) ) {
			parser.pos = start;
			return null;
		}

		parser.inAttribute = false;

		return tokens;
	}

	function readQuotedStringToken ( parser, quoteMark ) {
		var haystack = parser.remaining();

		var needles = parser.tags.map( function ( t ) { return t.open; } ); // TODO refactor... we do this in readText.js as well
		needles.push( quoteMark );

		var index = getLowestIndex( haystack, needles );

		if ( index === -1 ) {
			parser.error( 'Quoted attribute value must have a closing quote' );
		}

		if ( !index ) {
			return null;
		}

		parser.pos += index;
		return haystack.substr( 0, index );
	}

	function readAttributeOrDirective ( parser ) {
			var match,
				attribute,
			    directive;

			attribute = readAttribute( parser );

			if ( !attribute ) return null;

			// intro, outro, decorator
			if ( directive = directives[ attribute.n ] ) {
				attribute.t = directive.t;
				if ( directive.v ) attribute.v = directive.v;
				delete attribute.n; // no name necessary

				if ( directive.t === TRANSITION || directive.t === DECORATOR ) attribute.f = processDirective( attribute.f, parser );

				if ( directive.t === TRANSITION ) {
					warnOnceIfDebug( ("" + (directive.v === 't0' ? 'intro-outro' : directive.v === 't1' ? 'intro' : 'outro') + " is deprecated. To specify tranisitions, use the transition name suffixed with '-in', '-out', or '-in-out' as an attribute. Arguments can be specified in the attribute value as a simple list of expressions without mustaches.") );
				} else if ( directive.t === DECORATOR ) {
					warnOnceIfDebug( ("decorator is deprecated. To specify decorators, use the decorator name prefixed with 'as-' as an attribute. Arguments can be specified in the attribute value as a simple list of expressions without mustaches.") );
				}
			}

			// decorators
			else if ( match = decoratorPattern.exec( attribute.n ) ) {
				delete attribute.n;
				attribute.t = DECORATOR;
				attribute.f = processDirective( attribute.f, parser, DECORATOR );
				if ( typeof attribute.f === 'object' ) attribute.f.n = match[1];
				else attribute.f = match[1];
			}

			// transitions
			else if ( match = transitionPattern.exec( attribute.n ) ) {
				delete attribute.n;
				attribute.t = TRANSITION;
				attribute.f = processDirective( attribute.f, parser, TRANSITION );
				if ( typeof attribute.f === 'object' ) attribute.f.n = match[1];
				else attribute.f = match[1];
				attribute.v = match[2] === 'in-out' ? 't0' : match[2] === 'in' ? 't1' : 't2';
			}

			// on-click etc
			else if ( match = proxyEventPattern.exec( attribute.n ) ) {
				attribute.n = match[1];
				attribute.t = EVENT;
				attribute.f = processDirective( attribute.f, parser, EVENT );

				if ( reservedEventNames.test( attribute.f.n || attribute.f ) ) {
					parser.pos -= ( attribute.f.n || attribute.f ).length;
					parser.error( 'Cannot use reserved event names (change, reset, teardown, update, construct, config, init, render, unrender, detach, insert)' );
				}
			}

			else {
				if ( parser.sanitizeEventAttributes && onPattern.test( attribute.n ) ) {
					return { exclude: true };
				} else {
					attribute.f = attribute.f || ( attribute.f === '' ? '' : 0 );
					attribute.t = ATTRIBUTE;
				}
			}

			return attribute;
	}

	var delimiterChangeToken = { t: DELIMCHANGE, exclude: true };

	function readMustache ( parser ) {
		var mustache, i;

		// If we're inside a <script> or <style> tag, and we're not
		// interpolating, bug out
		if ( parser.interpolate[ parser.inside ] === false ) {
			return null;
		}

		for ( i = 0; i < parser.tags.length; i += 1 ) {
			if ( mustache = readMustacheOfType( parser, parser.tags[i] ) ) {
				return mustache;
			}
		}

		if ( parser.inTag && !parser.inAttribute ) {
			mustache = readAttributeOrDirective( parser );
			if ( mustache ) {
				parser.allowWhitespace();
				return mustache;
			}
		}
	}

	function readMustacheOfType ( parser, tag ) {
		var start, mustache, reader, i;

		start = parser.pos;

		if ( parser.matchString( '\\' + tag.open ) ) {
			if ( start === 0 || parser.str[ start - 1 ] !== '\\' ) {
				return tag.open;
			}
		} else if ( !parser.matchString( tag.open ) ) {
			return null;
		}

		// delimiter change?
		if ( mustache = readDelimiterChange( parser ) ) {
			// find closing delimiter or abort...
			if ( !parser.matchString( tag.close ) ) {
				return null;
			}

			// ...then make the switch
			tag.open = mustache[0];
			tag.close = mustache[1];
			parser.sortMustacheTags();

			return delimiterChangeToken;
		}

		parser.allowWhitespace();

		// illegal section closer
		if ( parser.matchString( '/' ) ) {
			parser.pos -= 1;
			var rewind = parser.pos;
			if ( !readNumberLiteral( parser ) ) {
				parser.pos = rewind - ( tag.close.length );
				if ( parser.inAttribute ) {
					parser.pos = start;
					return null;
				} else {
					parser.error( 'Attempted to close a section that wasn\'t open' );
				}
			} else {
				parser.pos = rewind;
			}
		}

		for ( i = 0; i < tag.readers.length; i += 1 ) {
			reader = tag.readers[i];

			if ( mustache = reader( parser, tag ) ) {
				if ( tag.isStatic ) {
					mustache.s = true; // TODO make this `1` instead - more compact
				}

				if ( parser.includeLinePositions ) {
					mustache.p = parser.getLinePos( start );
				}

				return mustache;
			}
		}

		parser.pos = start;
		return null;
	}

	function refineExpression ( expression, mustache ) {
		var referenceExpression;

		if ( expression ) {
			while ( expression.t === BRACKETED && expression.x ) {
				expression = expression.x;
			}

			if ( expression.t === REFERENCE ) {
				mustache.r = expression.n;
			} else {
				if ( referenceExpression = getReferenceExpression( expression ) ) {
					mustache.rx = referenceExpression;
				} else {
					mustache.x = flattenExpression( expression );
				}
			}

			return mustache;
		}
	}

	// TODO refactor this! it's bewildering
	function getReferenceExpression ( expression ) {
		var members = [], refinement;

		while ( expression.t === MEMBER && expression.r.t === REFINEMENT ) {
			refinement = expression.r;

			if ( refinement.x ) {
				if ( refinement.x.t === REFERENCE ) {
					members.unshift( refinement.x );
				} else {
					members.unshift( flattenExpression( refinement.x ) );
				}
			} else {
				members.unshift( refinement.n );
			}

			expression = expression.x;
		}

		if ( expression.t !== REFERENCE ) {
			return null;
		}

		return {
			r: expression.n,
			m: members
		};
	}

	function readTriple ( parser, tag ) {
		var expression = readExpression( parser ), triple;

		if ( !expression ) {
			return null;
		}

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
		}

		triple = { t: TRIPLE };
		refineExpression( expression, triple ); // TODO handle this differently - it's mysterious

		return triple;
	}

	function readUnescaped ( parser, tag ) {
		var expression, triple;

		if ( !parser.matchString( '&' ) ) {
			return null;
		}

		parser.allowWhitespace();

		expression = readExpression( parser );

		if ( !expression ) {
			return null;
		}

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
		}

		triple = { t: TRIPLE };
		refineExpression( expression, triple ); // TODO handle this differently - it's mysterious

		return triple;
	}

	var legalAlias = /^(?:[a-zA-Z$_0-9]|\\\.)+(?:(?:(?:[a-zA-Z$_0-9]|\\\.)+)|(?:\[[0-9]+\]))*/;
	var asRE = /^as/i;

	function readAliases( parser ) {
		var aliases = [], alias, start = parser.pos;

		parser.allowWhitespace();

		alias = readAlias( parser );

		if ( alias ) {
			alias.x = refineExpression( alias.x, {} );
			aliases.push( alias );

			parser.allowWhitespace();

			while ( parser.matchString(',') ) {
				alias = readAlias( parser );

				if ( !alias ) {
					parser.error( 'Expected another alias.' );
				}

				alias.x = refineExpression( alias.x, {} );
				aliases.push( alias );

				parser.allowWhitespace();
			}

			return aliases;
		}

		parser.pos = start;
		return null;
	}

	function readAlias( parser ) {
		var expr, alias, start = parser.pos;

		parser.allowWhitespace();

		expr = readExpression( parser, [] );

		if ( !expr ) {
			parser.pos = start;
			return null;
		}

		parser.allowWhitespace();

		if ( !parser.matchPattern( asRE ) ) {
			parser.pos = start;
			return null;
		}

		parser.allowWhitespace();

		alias = parser.matchPattern( legalAlias );

		if ( !alias ) {
			parser.error( 'Expected a legal alias name.' );
		}

		return { n: alias, x: expr };
	}

	function readPartial ( parser, tag ) {
		if ( !parser.matchString( '>' ) ) return null;

		parser.allowWhitespace();

		// Partial names can include hyphens, so we can't use readExpression
		// blindly. Instead, we use the `relaxedNames` flag to indicate that
		// `foo-bar` should be read as a single name, rather than 'subtract
		// bar from foo'
		parser.relaxedNames = parser.strictRefinement = true;
		var expression = readExpression( parser );
		parser.relaxedNames = parser.strictRefinement = false;

		if ( !expression ) return null;

		var partial = { t: PARTIAL };
		refineExpression( expression, partial ); // TODO...

		parser.allowWhitespace();

		// check for alias context e.g. `{{>foo bar as bat, bip as bop}}` then
		// turn it into `{{#with bar as bat, bip as bop}}{{>foo}}{{/with}}`
		var aliases = readAliases( parser );
		if ( aliases ) {
			partial = {
				t: ALIAS,
				z: aliases,
				f: [ partial ]
			};
		}

		// otherwise check for literal context e.g. `{{>foo bar}}` then
		// turn it into `{{#with bar}}{{>foo}}{{/with}}`
		else {
			var context = readExpression( parser );
			if ( context) {
				partial = {
					t: SECTION,
					n: SECTION_WITH,
					f: [ partial ]
				};

				refineExpression( context, partial );
			}
		}

		parser.allowWhitespace();

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
		}

		return partial;
	}

	function readComment ( parser, tag ) {
		var index;

		if ( !parser.matchString( '!' ) ) {
			return null;
		}

		index = parser.remaining().indexOf( tag.close );

		if ( index !== -1 ) {
			parser.pos += index + tag.close.length;
			return { t: COMMENT };
		}
	}

	function readExpressionOrReference ( parser, expectedFollowers ) {
		var start, expression, i;

		start = parser.pos;
		expression = readExpression( parser );

		if ( !expression ) {
			// valid reference but invalid expression e.g. `{{new}}`?
			var ref = parser.matchPattern( /^(\w+)/ );
			if ( ref ) {
				return {
					t: REFERENCE,
					n: ref
				};
			}

			return null;
		}

		for ( i = 0; i < expectedFollowers.length; i += 1 ) {
			if ( parser.remaining().substr( 0, expectedFollowers[i].length ) === expectedFollowers[i] ) {
				return expression;
			}
		}

		parser.pos = start;
		return readReference( parser );
	}

	function readInterpolator ( parser, tag ) {
		var start, expression, interpolator, err;

		start = parser.pos;

		// TODO would be good for perf if we could do away with the try-catch
		try {
			expression = readExpressionOrReference( parser, [ tag.close ]);
		} catch ( e ) {
			err = e;
		}

		if ( !expression ) {
			if ( parser.str.charAt( start ) === '!' ) {
				// special case - comment
				parser.pos = start;
				return null;
			}

			if ( err ) {
				throw err;
			}
		}

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "' after reference") );

			if ( !expression ) {
				// special case - comment
				if ( parser.nextChar() === '!' ) {
					return null;
				}

				parser.error( ("Expected expression or legal reference") );
			}
		}

		interpolator = { t: INTERPOLATOR };
		refineExpression( expression, interpolator ); // TODO handle this differently - it's mysterious

		return interpolator;
	}

	var yieldPattern = /^yield\s*/;

	function readYielder ( parser, tag ) {
		if ( !parser.matchPattern( yieldPattern ) ) return null;

		var name = parser.matchPattern( /^[a-zA-Z_$][a-zA-Z_$0-9\-]*/ );

		parser.allowWhitespace();

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("expected legal partial name") );
		}

		var yielder = { t: YIELDER };
		if ( name ) yielder.n = name;

		return yielder;
	}

	function readClosing ( parser, tag ) {
		var start, remaining, index, closing;

		start = parser.pos;

		if ( !parser.matchString( tag.open ) ) {
			return null;
		}

		parser.allowWhitespace();

		if ( !parser.matchString( '/' ) ) {
			parser.pos = start;
			return null;
		}

		parser.allowWhitespace();

		remaining = parser.remaining();
		index = remaining.indexOf( tag.close );

		if ( index !== -1 ) {
			closing = {
				t: CLOSING,
				r: remaining.substr( 0, index ).split( ' ' )[0]
			};

			parser.pos += index;

			if ( !parser.matchString( tag.close ) ) {
				parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
			}

			return closing;
		}

		parser.pos = start;
		return null;
	}

	var elsePattern = /^\s*else\s*/;

	function readElse ( parser, tag ) {
		var start = parser.pos;

		if ( !parser.matchString( tag.open ) ) {
			return null;
		}

		if ( !parser.matchPattern( elsePattern ) ) {
			parser.pos = start;
			return null;
		}

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
		}

		return {
			t: ELSE
		};
	}

	var elsePattern$1 = /^\s*elseif\s+/;

	function readElseIf ( parser, tag ) {
		var start = parser.pos;

		if ( !parser.matchString( tag.open ) ) {
			return null;
		}

		if ( !parser.matchPattern( elsePattern$1 ) ) {
			parser.pos = start;
			return null;
		}

		var expression = readExpression( parser );

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
		}

		return {
			t: ELSEIF,
			x: expression
		};
	}

	var handlebarsBlockCodes = {
		'each':    SECTION_EACH,
		'if':      SECTION_IF,
		'with':    SECTION_IF_WITH,
		'unless':  SECTION_UNLESS
	};

	var indexRefPattern = /^\s*:\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/;
	var keyIndexRefPattern = /^\s*,\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/;
	var handlebarsBlockPattern = new RegExp( '^(' + Object.keys( handlebarsBlockCodes ).join( '|' ) + ')\\b' );
	function readSection ( parser, tag ) {
		var start, expression, section, child, children, hasElse, block, unlessBlock, conditions, closed, i, expectedClose, aliasOnly = false;

		start = parser.pos;

		if ( parser.matchString( '^' ) ) {
			section = { t: SECTION, f: [], n: SECTION_UNLESS };
		} else if ( parser.matchString( '#' ) ) {
			section = { t: SECTION, f: [] };

			if ( parser.matchString( 'partial' ) ) {
				parser.pos = start - parser.standardDelimiters[0].length;
				parser.error( 'Partial definitions can only be at the top level of the template, or immediately inside components' );
			}

			if ( block = parser.matchPattern( handlebarsBlockPattern ) ) {
				expectedClose = block;
				section.n = handlebarsBlockCodes[ block ];
			}
		} else {
			return null;
		}

		parser.allowWhitespace();

		if ( block === 'with' ) {
			var aliases = readAliases( parser );
			if ( aliases ) {
				aliasOnly = true;
				section.z = aliases;
				section.t = ALIAS;
			}
		} else if ( block === 'each' ) {
			var alias = readAlias( parser );
			if ( alias ) {
				section.z = [ { n: alias.n, x: { r: '.' } } ];
				expression = alias.x;
			}
		}

		if ( !aliasOnly ) {
			if ( !expression ) expression = readExpression( parser );

			if ( !expression ) {
				parser.error( 'Expected expression' );
			}

			// optional index and key references
			if ( i = parser.matchPattern( indexRefPattern ) ) {
				var extra;

				if ( extra = parser.matchPattern( keyIndexRefPattern ) ) {
					section.i = i + ',' + extra;
				} else {
					section.i = i;
				}
			}
		}

		parser.allowWhitespace();

		if ( !parser.matchString( tag.close ) ) {
			parser.error( ("Expected closing delimiter '" + (tag.close) + "'") );
		}

		parser.sectionDepth += 1;
		children = section.f;

		conditions = [];

		var pos;
		do {
			pos = parser.pos;
			if ( child = readClosing( parser, tag ) ) {
				if ( expectedClose && child.r !== expectedClose ) {
					parser.pos = pos;
					parser.error( ("Expected " + (tag.open) + "/" + expectedClose + "" + (tag.close)) );
				}

				parser.sectionDepth -= 1;
				closed = true;
			}

			else if ( !aliasOnly && ( child = readElseIf( parser, tag ) ) ) {
				if ( section.n === SECTION_UNLESS ) {
					parser.error( '{{else}} not allowed in {{#unless}}' );
				}

				if ( hasElse ) {
					parser.error( 'illegal {{elseif...}} after {{else}}' );
				}

				if ( !unlessBlock ) {
					unlessBlock = [];
				}

				var mustache = {
					t: SECTION,
					n: SECTION_IF,
					f: children = []
				};
				refineExpression( child.x, mustache );

				unlessBlock.push( mustache );
			}

			else if ( !aliasOnly && ( child = readElse( parser, tag ) ) ) {
				if ( section.n === SECTION_UNLESS ) {
					parser.error( '{{else}} not allowed in {{#unless}}' );
				}

				if ( hasElse ) {
					parser.error( 'there can only be one {{else}} block, at the end of a section' );
				}

				hasElse = true;

				// use an unless block if there's no elseif
				if ( !unlessBlock ) {
					unlessBlock = [];
				}

				unlessBlock.push({
					t: SECTION,
					n: SECTION_UNLESS,
					f: children = []
				});
			}

			else {
				child = parser.read( READERS );

				if ( !child ) {
					break;
				}

				children.push( child );
			}
		} while ( !closed );

		if ( unlessBlock ) {
			section.l = unlessBlock;
		}

		if ( !aliasOnly ) {
			refineExpression( expression, section );
		}

		// TODO if a section is empty it should be discarded. Don't do
		// that here though - we need to clean everything up first, as
		// it may contain removeable whitespace. As a temporary measure,
		// to pass the existing tests, remove empty `f` arrays
		if ( !section.f.length ) {
			delete section.f;
		}

		return section;
	}

	var OPEN_COMMENT = '<!--';
	var CLOSE_COMMENT = '-->';
	function readHtmlComment ( parser ) {
		var start, content, remaining, endIndex, comment;

		start = parser.pos;

		if ( parser.textOnlyMode || !parser.matchString( OPEN_COMMENT ) ) {
			return null;
		}

		remaining = parser.remaining();
		endIndex = remaining.indexOf( CLOSE_COMMENT );

		if ( endIndex === -1 ) {
			parser.error( 'Illegal HTML - expected closing comment sequence (\'-->\')' );
		}

		content = remaining.substr( 0, endIndex );
		parser.pos += endIndex + 3;

		comment = {
			t: COMMENT,
			c: content
		};

		if ( parser.includeLinePositions ) {
			comment.p = parser.getLinePos( start );
		}

		return comment;
	}

	var leadingLinebreak = /^[ \t\f\r\n]*\r?\n/;
	var trailingLinebreak = /\r?\n[ \t\f\r\n]*$/;
	function stripStandalones ( items ) {
		var i, current, backOne, backTwo, lastSectionItem;

		for ( i=1; i<items.length; i+=1 ) {
			current = items[i];
			backOne = items[i-1];
			backTwo = items[i-2];

			// if we're at the end of a [text][comment][text] sequence...
			if ( isString( current ) && isComment( backOne ) && isString( backTwo ) ) {

				// ... and the comment is a standalone (i.e. line breaks either side)...
				if ( trailingLinebreak.test( backTwo ) && leadingLinebreak.test( current ) ) {

					// ... then we want to remove the whitespace after the first line break
					items[i-2] = backTwo.replace( trailingLinebreak, '\n' );

					// and the leading line break of the second text token
					items[i] = current.replace( leadingLinebreak, '' );
				}
			}

			// if the current item is a section, and it is preceded by a linebreak, and
			// its first item is a linebreak...
			if ( isSection( current ) && isString( backOne ) ) {
				if ( trailingLinebreak.test( backOne ) && isString( current.f[0] ) && leadingLinebreak.test( current.f[0] ) ) {
					items[i-1] = backOne.replace( trailingLinebreak, '\n' );
					current.f[0] = current.f[0].replace( leadingLinebreak, '' );
				}
			}

			// if the last item was a section, and it is followed by a linebreak, and
			// its last item is a linebreak...
			if ( isString( current ) && isSection( backOne ) ) {
				lastSectionItem = lastItem( backOne.f );

				if ( isString( lastSectionItem ) && trailingLinebreak.test( lastSectionItem ) && leadingLinebreak.test( current ) ) {
					backOne.f[ backOne.f.length - 1 ] = lastSectionItem.replace( trailingLinebreak, '\n' );
					items[i] = current.replace( leadingLinebreak, '' );
				}
			}
		}

		return items;
	}

	function isString ( item ) {
		return typeof item === 'string';
	}

	function isComment ( item ) {
		return item.t === COMMENT || item.t === DELIMCHANGE;
	}

	function isSection ( item ) {
		return ( item.t === SECTION || item.t === INVERTED ) && item.f;
	}

	function trimWhitespace ( items, leadingPattern, trailingPattern ) {
		var item;

		if ( leadingPattern ) {
			item = items[0];
			if ( typeof item === 'string' ) {
				item = item.replace( leadingPattern, '' );

				if ( !item ) {
					items.shift();
				} else {
					items[0] = item;
				}
			}
		}

		if ( trailingPattern ) {
			item = lastItem( items );
			if ( typeof item === 'string' ) {
				item = item.replace( trailingPattern, '' );

				if ( !item ) {
					items.pop();
				} else {
					items[ items.length - 1 ] = item;
				}
			}
		}
	}

	var contiguousWhitespace = /[ \t\f\r\n]+/g;
	var preserveWhitespaceElements = /^(?:pre|script|style|textarea)$/i;
	var leadingWhitespace$1 = /^[ \t\f\r\n]+/;
	var trailingWhitespace = /[ \t\f\r\n]+$/;
	var leadingNewLine = /^(?:\r\n|\r|\n)/;
	var trailingNewLine = /(?:\r\n|\r|\n)$/;

	function cleanup ( items, stripComments, preserveWhitespace, removeLeadingWhitespace, removeTrailingWhitespace ) {
		if ( typeof items === 'string' ) return;

		var i,
			item,
			previousItem,
			nextItem,
			preserveWhitespaceInsideFragment,
			removeLeadingWhitespaceInsideFragment,
			removeTrailingWhitespaceInsideFragment,
			key;

		// First pass - remove standalones and comments etc
		stripStandalones( items );

		i = items.length;
		while ( i-- ) {
			item = items[i];

			// Remove delimiter changes, unsafe elements etc
			if ( item.exclude ) {
				items.splice( i, 1 );
			}

			// Remove comments, unless we want to keep them
			else if ( stripComments && item.t === COMMENT ) {
				items.splice( i, 1 );
			}
		}

		// If necessary, remove leading and trailing whitespace
		trimWhitespace( items, removeLeadingWhitespace ? leadingWhitespace$1 : null, removeTrailingWhitespace ? trailingWhitespace : null );

		i = items.length;
		while ( i-- ) {
			item = items[i];

			// Recurse
			if ( item.f ) {
				var isPreserveWhitespaceElement = item.t === ELEMENT && preserveWhitespaceElements.test( item.e );
				preserveWhitespaceInsideFragment = preserveWhitespace || isPreserveWhitespaceElement;

				if ( !preserveWhitespace && isPreserveWhitespaceElement ) {
					trimWhitespace( item.f, leadingNewLine, trailingNewLine );
				}

				if ( !preserveWhitespaceInsideFragment ) {
					previousItem = items[ i - 1 ];
					nextItem = items[ i + 1 ];

					// if the previous item was a text item with trailing whitespace,
					// remove leading whitespace inside the fragment
					if ( !previousItem || ( typeof previousItem === 'string' && trailingWhitespace.test( previousItem ) ) ) {
						removeLeadingWhitespaceInsideFragment = true;
					}

					// and vice versa
					if ( !nextItem || ( typeof nextItem === 'string' && leadingWhitespace$1.test( nextItem ) ) ) {
						removeTrailingWhitespaceInsideFragment = true;
					}
				}

				cleanup( item.f, stripComments, preserveWhitespaceInsideFragment, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment );

				// clean up name templates (events, decorators, etc)
				if ( isArray( item.f.n ) ) {
					cleanup( item.f.n, stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespace );
				}

				// clean up arg templates (events, decorators, etc)
				if ( isArray( item.f.d ) ) {
					cleanup( item.f.d, stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespace );
				}
			}

			// Split if-else blocks into two (an if, and an unless)
			if ( item.l ) {
				cleanup( item.l, stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment );

				item.l.forEach( function ( s ) { return s.l = 1; } );
				item.l.unshift( i + 1, 0 );
				items.splice.apply( items, item.l );
				delete item.l; // TODO would be nice if there was a way around this
			}

			// Clean up element attributes
			if ( item.a ) {
				for ( key in item.a ) {
					if ( item.a.hasOwnProperty( key ) && typeof item.a[ key ] !== 'string' ) {
						cleanup( item.a[ key ], stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment );
					}
				}
			}
			// Clean up conditional attributes
			if ( item.m ) {
				cleanup( item.m, stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment );
				if ( item.m.length < 1 ) delete item.m;
			}
		}

		// final pass - fuse text nodes together
		i = items.length;
		while ( i-- ) {
			if ( typeof items[i] === 'string' ) {
				if ( typeof items[i+1] === 'string' ) {
					items[i] = items[i] + items[i+1];
					items.splice( i + 1, 1 );
				}

				if ( !preserveWhitespace ) {
					items[i] = items[i].replace( contiguousWhitespace, ' ' );
				}

				if ( items[i] === '' ) {
					items.splice( i, 1 );
				}
			}
		}
	}

	var closingTagPattern = /^([a-zA-Z]{1,}:?[a-zA-Z0-9\-]*)\s*\>/;

	function readClosingTag ( parser ) {
		var start, tag;

		start = parser.pos;

		// are we looking at a closing tag?
		if ( !parser.matchString( '</' ) ) {
			return null;
		}

		if ( tag = parser.matchPattern( closingTagPattern ) ) {
			if ( parser.inside && tag !== parser.inside ) {
				parser.pos = start;
				return null;
			}

			return {
				t: CLOSING_TAG,
				e: tag
			};
		}

		// We have an illegal closing tag, report it
		parser.pos -= 2;
		parser.error( 'Illegal closing tag' );
	}

	var tagNamePattern = /^[a-zA-Z]{1,}:?[a-zA-Z0-9\-]*/;
	var validTagNameFollower = /^[\s\n\/>]/;
	var exclude = { exclude: true };
	var disallowedContents;
	// based on http://developers.whatwg.org/syntax.html#syntax-tag-omission
	disallowedContents = {
		li: [ 'li' ],
		dt: [ 'dt', 'dd' ],
		dd: [ 'dt', 'dd' ],
		p: 'address article aside blockquote div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul'.split( ' ' ),
		rt: [ 'rt', 'rp' ],
		rp: [ 'rt', 'rp' ],
		optgroup: [ 'optgroup' ],
		option: [ 'option', 'optgroup' ],
		thead: [ 'tbody', 'tfoot' ],
		tbody: [ 'tbody', 'tfoot' ],
		tfoot: [ 'tbody' ],
		tr: [ 'tr', 'tbody' ],
		td: [ 'td', 'th', 'tr' ],
		th: [ 'td', 'th', 'tr' ]
	};

	function readElement ( parser ) {
		var start,
			element,
			attribute,
			selfClosing,
			children,
			partials,
			hasPartials,
			child,
			closed,
			pos,
			remaining,
			closingTag;

		start = parser.pos;

		if ( parser.inside || parser.inAttribute || parser.textOnlyMode ) {
			return null;
		}

		if ( !parser.matchString( '<' ) ) {
			return null;
		}

		// if this is a closing tag, abort straight away
		if ( parser.nextChar() === '/' ) {
			return null;
		}

		element = {};
		if ( parser.includeLinePositions ) {
			element.p = parser.getLinePos( start );
		}

		if ( parser.matchString( '!' ) ) {
			element.t = DOCTYPE;
			if ( !parser.matchPattern( /^doctype/i ) ) {
				parser.error( 'Expected DOCTYPE declaration' );
			}

			element.a = parser.matchPattern( /^(.+?)>/ );
			return element;
		}

		element.t = ELEMENT;

		// element name
		element.e = parser.matchPattern( tagNamePattern );
		if ( !element.e ) {
			return null;
		}

		// next character must be whitespace, closing solidus or '>'
		if ( !validTagNameFollower.test( parser.nextChar() ) ) {
			parser.error( 'Illegal tag name' );
		}

		parser.allowWhitespace();

		parser.inTag = true;

		// directives and attributes
		while ( attribute = readMustache( parser ) ) {
			if ( attribute !== false ) {
				if ( !element.m ) element.m = [];
				element.m.push( attribute );
			}

			parser.allowWhitespace();
		}

		parser.inTag = false;

		// allow whitespace before closing solidus
		parser.allowWhitespace();

		// self-closing solidus?
		if ( parser.matchString( '/' ) ) {
			selfClosing = true;
		}

		// closing angle bracket
		if ( !parser.matchString( '>' ) ) {
			return null;
		}

		var lowerCaseName = element.e.toLowerCase();
		var preserveWhitespace = parser.preserveWhitespace;

		if ( !selfClosing && !voidElementNames.test( element.e ) ) {
			parser.elementStack.push( lowerCaseName );

			// Special case - if we open a script element, further tags should
			// be ignored unless they're a closing script element
			if ( lowerCaseName === 'script' || lowerCaseName === 'style' || lowerCaseName === 'textarea' ) {
				parser.inside = lowerCaseName;
			}

			children = [];
			partials = create( null );

			do {
				pos = parser.pos;
				remaining = parser.remaining();

				if ( !remaining ) {
					parser.error( ("Missing end " + (parser.elementStack.length > 1 ? 'tags' : 'tag') + " (" + (parser.elementStack.reverse().map( function ( x ) { return ("</" + x + ">"); } ).join( '' )) + ")") );
				}

				// if for example we're in an <li> element, and we see another
				// <li> tag, close the first so they become siblings
				if ( !canContain( lowerCaseName, remaining ) ) {
					closed = true;
				}

				// closing tag
				else if ( closingTag = readClosingTag( parser ) ) {
					closed = true;

					var closingTagName = closingTag.e.toLowerCase();

					// if this *isn't* the closing tag for the current element...
					if ( closingTagName !== lowerCaseName ) {
						// rewind parser
						parser.pos = pos;

						// if it doesn't close a parent tag, error
						if ( !~parser.elementStack.indexOf( closingTagName ) ) {
							var errorMessage = 'Unexpected closing tag';

							// add additional help for void elements, since component names
							// might clash with them
							if ( voidElementNames.test( closingTagName ) ) {
								errorMessage += " (<" + closingTagName + "> is a void element - it cannot contain children)";
							}

							parser.error( errorMessage );
						}
					}
				}

				// implicit close by closing section tag. TODO clean this up
				else if ( child = readClosing( parser, { open: parser.standardDelimiters[0], close: parser.standardDelimiters[1] } ) ) {
					closed = true;
					parser.pos = pos;
				}

				else {
					if ( child = parser.read( PARTIAL_READERS ) ) {
						if ( partials[ child.n ] ) {
							parser.pos = pos;
							parser.error( 'Duplicate partial definition' );
						}

						cleanup( child.f, parser.stripComments, preserveWhitespace, !preserveWhitespace, !preserveWhitespace );

						partials[ child.n ] = child.f;
						hasPartials = true;
					}

					else {
						if ( child = parser.read( READERS ) ) {
							children.push( child );
						} else {
							closed = true;
						}
					}
				}
			} while ( !closed );

			if ( children.length ) {
				element.f = children;
			}

			if ( hasPartials ) {
				element.p = partials;
			}

			parser.elementStack.pop();
		}

		parser.inside = null;

		if ( parser.sanitizeElements && parser.sanitizeElements.indexOf( lowerCaseName ) !== -1 ) {
			return exclude;
		}

		return element;
	}

	function canContain ( name, remaining ) {
		var match, disallowed;

		match = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec( remaining );
		disallowed = disallowedContents[ name ];

		if ( !match || !disallowed ) {
			return true;
		}

		return !~disallowed.indexOf( match[1].toLowerCase() );
	}

	function readText ( parser ) {
		var index, remaining, disallowed, barrier;

		remaining = parser.remaining();

		if ( parser.textOnlyMode ) {
			disallowed = parser.tags.map( function ( t ) { return t.open; } );
			disallowed = disallowed.concat( parser.tags.map( function ( t ) { return '\\' + t.open; } ) );

			index = getLowestIndex( remaining, disallowed );
		} else {
			barrier = parser.inside ? '</' + parser.inside : '<';

			if ( parser.inside && !parser.interpolate[ parser.inside ] ) {
				index = remaining.indexOf( barrier );
			} else {
				disallowed = parser.tags.map( function ( t ) { return t.open; } );
				disallowed = disallowed.concat( parser.tags.map( function ( t ) { return '\\' + t.open; } ) );

				// http://developers.whatwg.org/syntax.html#syntax-attributes
				if ( parser.inAttribute === true ) {
					// we're inside an unquoted attribute value
					disallowed.push( ("\""), ("'"), ("="), ("<"), (">"), '`' );
				} else if ( parser.inAttribute ) {
					// quoted attribute value
					disallowed.push( parser.inAttribute );
				} else {
					disallowed.push( barrier );
				}

				index = getLowestIndex( remaining, disallowed );
			}
		}

		if ( !index ) {
			return null;
		}

		if ( index === -1 ) {
			index = remaining.length;
		}

		parser.pos += index;

		if ( ( parser.inside && parser.inside !== 'textarea' ) || parser.textOnlyMode ) {
			return remaining.substr( 0, index );
		} else {
			return decodeCharacterReferences( remaining.substr( 0, index ) );
		}
	}

	var startPattern = /^<!--\s*/;
	var namePattern$1 = /s*>\s*([a-zA-Z_$][-a-zA-Z_$0-9]*)\s*/;
	var finishPattern = /\s*-->/;

	function readPartialDefinitionComment ( parser ) {
		var start = parser.pos;
		var open = parser.standardDelimiters[0];
		var close = parser.standardDelimiters[1];

		if ( !parser.matchPattern( startPattern ) || !parser.matchString( open ) ) {
			parser.pos = start;
			return null;
		}

		var name = parser.matchPattern( namePattern$1 );

		warnOnceIfDebug( ("Inline partial comments are deprecated.\nUse this...\n  {{#partial " + name + "}} ... {{/partial}}\n\n...instead of this:\n  <!-- {{>" + name + "}} --> ... <!-- {{/" + name + "}} -->'") );

		// make sure the rest of the comment is in the correct place
		if ( !parser.matchString( close ) || !parser.matchPattern( finishPattern ) ) {
			parser.pos = start;
			return null;
		}

		var content = [];
		var closed;

		var endPattern = new RegExp('^<!--\\s*' + escapeRegExp( open ) + '\\s*\\/\\s*' + name + '\\s*' + escapeRegExp( close ) + '\\s*-->');

		do {
			if ( parser.matchPattern( endPattern ) ) {
				closed = true;
			}

			else {
				var child = parser.read( READERS );
				if ( !child ) {
					parser.error( ("expected closing comment ('<!-- " + open + "/" + name + "" + close + " -->')") );
				}

				content.push( child );
			}
		} while ( !closed );

		return {
			t: INLINE_PARTIAL,
			f: content,
			n: name
		};
	}

	var partialDefinitionSectionPattern = /^\s*#\s*partial\s+/;

	function readPartialDefinitionSection ( parser ) {
		var start, name, content, child, closed;

		start = parser.pos;

		var delimiters = parser.standardDelimiters;

		if ( !parser.matchString( delimiters[0] ) ) {
			return null;
		}

		if ( !parser.matchPattern( partialDefinitionSectionPattern ) ) {
			parser.pos = start;
			return null;
		}

		name = parser.matchPattern( /^[a-zA-Z_$][a-zA-Z_$0-9\-\/]*/ );

		if ( !name ) {
			parser.error( 'expected legal partial name' );
		}

		parser.allowWhitespace();
		if ( !parser.matchString( delimiters[1] ) ) {
			parser.error( ("Expected closing delimiter '" + (delimiters[1]) + "'") );
		}

		content = [];

		do {
			// TODO clean this up
			if ( child = readClosing( parser, { open: parser.standardDelimiters[0], close: parser.standardDelimiters[1] }) ) {
				if ( !child.r === 'partial' ) {
					parser.error( ("Expected " + (delimiters[0]) + "/partial" + (delimiters[1])) );
				}

				closed = true;
			}

			else {
				child = parser.read( READERS );

				if ( !child ) {
					parser.error( ("Expected " + (delimiters[0]) + "/partial" + (delimiters[1])) );
				}

				content.push( child );
			}
		} while ( !closed );

		return {
			t: INLINE_PARTIAL,
			n: name,
			f: content
		};
	}

	function readTemplate ( parser ) {
		var fragment = [];
		var partials = create( null );
		var hasPartials = false;

		var preserveWhitespace = parser.preserveWhitespace;

		while ( parser.pos < parser.str.length ) {
			var pos = parser.pos, item, partial;

			if ( partial = parser.read( PARTIAL_READERS ) ) {
				if ( partials[ partial.n ] ) {
					parser.pos = pos;
					parser.error( 'Duplicated partial definition' );
				}

				cleanup( partial.f, parser.stripComments, preserveWhitespace, !preserveWhitespace, !preserveWhitespace );

				partials[ partial.n ] = partial.f;
				hasPartials = true;
			} else if ( item = parser.read( READERS ) ) {
				fragment.push( item );
			} else  {
				parser.error( 'Unexpected template content' );
			}
		}

		var result = {
			v: TEMPLATE_VERSION,
			t: fragment
		};

		if ( hasPartials ) {
			result.p = partials;
		}

		return result;
	}

	function insertExpressions ( obj, expr ) {

		Object.keys( obj ).forEach( function ( key ) {
			if  ( isExpression( key, obj ) ) return addTo( obj, expr );

			var ref = obj[ key ];
			if ( hasChildren( ref ) ) insertExpressions( ref, expr );
	 	});
	}

	function isExpression( key, obj ) {
		return key === 's' && isArray( obj.r );
	}

	function addTo( obj, expr ) {
		var s = obj.s, r = obj.r;
		if ( !expr[ s ] ) expr[ s ] = fromExpression( s, r.length );
	}

	function hasChildren( ref ) {
		return isArray( ref ) || isObject( ref );
	}

	// See https://github.com/ractivejs/template-spec for information
	// about the Ractive template specification

	var STANDARD_READERS = [ readPartial, readUnescaped, readSection, readYielder, readInterpolator, readComment ];
	var TRIPLE_READERS = [ readTriple ];
	var STATIC_READERS = [ readUnescaped, readSection, readInterpolator ]; // TODO does it make sense to have a static section?

	var StandardParser;

	function parse ( template, options ) {
		return new StandardParser( template, options || {} ).result;
	}

	parse.computedStrings = function( computed ) {
		if ( !computed ) return [];

		Object.keys( computed ).forEach( function ( key ) {
			var value = computed[ key ];
			if ( typeof value === 'string' ) {
				computed[ key ] = fromComputationString( value );
			}
		});
	};


	var READERS = [ readMustache, readHtmlComment, readElement, readText ];
	var PARTIAL_READERS = [ readPartialDefinitionComment, readPartialDefinitionSection ];

	StandardParser = Parser$1.extend({
		init: function ( str, options ) {
			var tripleDelimiters = options.tripleDelimiters || [ '{{{', '}}}' ],
				staticDelimiters = options.staticDelimiters || [ '[[', ']]' ],
				staticTripleDelimiters = options.staticTripleDelimiters || [ '[[[', ']]]' ];

			this.standardDelimiters = options.delimiters || [ '{{', '}}' ];

			this.tags = [
				{ isStatic: false, isTriple: false, open: this.standardDelimiters[0], close: this.standardDelimiters[1], readers: STANDARD_READERS },
				{ isStatic: false, isTriple: true,  open: tripleDelimiters[0],        close: tripleDelimiters[1],        readers: TRIPLE_READERS },
				{ isStatic: true,  isTriple: false, open: staticDelimiters[0],        close: staticDelimiters[1],        readers: STATIC_READERS },
				{ isStatic: true,  isTriple: true,  open: staticTripleDelimiters[0],  close: staticTripleDelimiters[1],  readers: TRIPLE_READERS }
			];

			this.contextLines = options.contextLines || 0;

			this.sortMustacheTags();

			this.sectionDepth = 0;
			this.elementStack = [];

			this.interpolate = {
				script: !options.interpolate || options.interpolate.script !== false,
				style: !options.interpolate || options.interpolate.style !== false,
				textarea: true
			};

			if ( options.sanitize === true ) {
				options.sanitize = {
					// blacklist from https://code.google.com/p/google-caja/source/browse/trunk/src/com/google/caja/lang/html/html4-elements-whitelist.json
					elements: 'applet base basefont body frame frameset head html isindex link meta noframes noscript object param script style title'.split( ' ' ),
					eventAttributes: true
				};
			}

			this.stripComments = options.stripComments !== false;
			this.preserveWhitespace = options.preserveWhitespace;
			this.sanitizeElements = options.sanitize && options.sanitize.elements;
			this.sanitizeEventAttributes = options.sanitize && options.sanitize.eventAttributes;
			this.includeLinePositions = options.includeLinePositions;
			this.textOnlyMode = options.textOnlyMode;
			this.csp = options.csp;
		},

		postProcess: function ( result ) {
			// special case - empty string
			if ( !result.length ) {
				return { t: [], v: TEMPLATE_VERSION };
			}

			if ( this.sectionDepth > 0 ) {
				this.error( 'A section was left open' );
			}

			cleanup( result[0].t, this.stripComments, this.preserveWhitespace, !this.preserveWhitespace, !this.preserveWhitespace );

			if ( this.csp !== false ) {
				var expr = {};
				insertExpressions( result[0].t, expr );
				if ( Object.keys( expr ).length ) result[0].e = expr;
			}

			return result[0];
		},

		converters: [
			readTemplate
		],

		sortMustacheTags: function () {
			// Sort in order of descending opening delimiter length (longer first),
			// to protect against opening delimiters being substrings of each other
			this.tags.sort( function ( a, b ) {
				return b.open.length - a.open.length;
			});
		}
	});

	var parseOptions = [
		'delimiters',
		'tripleDelimiters',
		'staticDelimiters',
		'staticTripleDelimiters',
		'csp',
		'interpolate',
		'preserveWhitespace',
		'sanitize',
		'stripComments',
		'contextLines'
	];

	var TEMPLATE_INSTRUCTIONS = "Either preparse or use a ractive runtime source that includes the parser. ";

	var COMPUTATION_INSTRUCTIONS = "Either use:\n\n\tRactive.parse.computedStrings( component.computed )\n\nat build time to pre-convert the strings to functions, or use functions instead of strings in computed properties.";


	function throwNoParse ( method, error, instructions ) {
		if ( !method ) {
			fatal( ("Missing Ractive.parse - cannot parse " + error + ". " + instructions) );
		}
	}

	function createFunction ( body, length ) {
		throwNoParse( fromExpression, 'new expression function', TEMPLATE_INSTRUCTIONS );
		return fromExpression( body, length );
	}

	function createFunctionFromString ( str, bindTo ) {
		throwNoParse( fromComputationString, 'compution string "${str}"', COMPUTATION_INSTRUCTIONS );
		return fromComputationString( str, bindTo );
	}

	var parser = {

		fromId: function ( id, options ) {
			if ( !doc ) {
				if ( options && options.noThrow ) { return; }
				throw new Error( ("Cannot retrieve template #" + id + " as Ractive is not running in a browser.") );
			}

			if ( id ) id = id.replace( /^#/, '' );

			var template;

			if ( !( template = doc.getElementById( id ) )) {
				if ( options && options.noThrow ) { return; }
				throw new Error( ("Could not find template element with id #" + id) );
			}

			if ( template.tagName.toUpperCase() !== 'SCRIPT' ) {
				if ( options && options.noThrow ) { return; }
				throw new Error( ("Template element with id #" + id + ", must be a <script> element") );
			}

			return ( 'textContent' in template ? template.textContent : template.innerHTML );

		},

		isParsed: function ( template) {
			return !( typeof template === 'string' );
		},

		getParseOptions: function ( ractive ) {
			// Could be Ractive or a Component
			if ( ractive.defaults ) { ractive = ractive.defaults; }

			return parseOptions.reduce( function ( val, key ) {
				val[ key ] = ractive[ key ];
				return val;
			}, {});
		},

		parse: function ( template, options ) {
			throwNoParse( parse, 'template', TEMPLATE_INSTRUCTIONS );
			var parsed = parse( template, options );
			addFunctions( parsed );
			return parsed;
		},

		parseFor: function( template, ractive ) {
			return this.parse( template, this.getParseOptions( ractive ) );
		}
	};

	var templateConfigurator = {
		name: 'template',

		extend: function ( Parent, proto, options ) {
			// only assign if exists
			if ( 'template' in options ) {
				var template = options.template;

				if ( typeof template === 'function' ) {
					proto.template = template;
				} else {
					proto.template = parseTemplate( template, proto );
				}
			}
		},

		init: function ( Parent, ractive, options ) {
			// TODO because of prototypal inheritance, we might just be able to use
			// ractive.template, and not bother passing through the Parent object.
			// At present that breaks the test mocks' expectations
			var template = 'template' in options ? options.template : Parent.prototype.template;
			template = template || { v: TEMPLATE_VERSION, t: [] };

			if ( typeof template === 'function' ) {
				var fn = template;
				template = getDynamicTemplate( ractive, fn );

				ractive._config.template = {
					fn: fn,
					result: template
				};
			}

			template = parseTemplate( template, ractive );

			// TODO the naming of this is confusing - ractive.template refers to [...],
			// but Component.prototype.template refers to {v:1,t:[],p:[]}...
			// it's unnecessary, because the developer never needs to access
			// ractive.template
			ractive.template = template.t;

			if ( template.p ) {
				extendPartials( ractive.partials, template.p );
			}
		},

		reset: function ( ractive ) {
			var result = resetValue( ractive );

			if ( result ) {
				var parsed = parseTemplate( result, ractive );

				ractive.template = parsed.t;
				extendPartials( ractive.partials, parsed.p, true );

				return true;
			}
		}
	};

	function resetValue ( ractive ) {
		var initial = ractive._config.template;

		// If this isn't a dynamic template, there's nothing to do
		if ( !initial || !initial.fn ) {
			return;
		}

		var result = getDynamicTemplate( ractive, initial.fn );

		// TODO deep equality check to prevent unnecessary re-rendering
		// in the case of already-parsed templates
		if ( result !== initial.result ) {
			initial.result = result;
			return result;
		}
	}

	function getDynamicTemplate ( ractive, fn ) {
		return fn.call( ractive, {
			fromId: parser.fromId,
			isParsed: parser.isParsed,
			parse: function ( template, options ) {
				if ( options === void 0 ) options = parser.getParseOptions( ractive );

				return parser.parse( template, options );
			}
		});
	}

	function parseTemplate ( template, ractive ) {
		if ( typeof template === 'string' ) {
			// parse will validate and add expression functions
			template = parseAsString( template, ractive );
		}
		else {
			// need to validate and add exp for already parsed template
			validate$1( template );
			addFunctions( template );
		}

		return template;
	}

	function parseAsString ( template, ractive ) {
		// ID of an element containing the template?
		if ( template[0] === '#' ) {
			template = parser.fromId( template );
		}

		return parser.parseFor( template, ractive );
	}

	function validate$1( template ) {

		// Check that the template even exists
		if ( template == undefined ) {
			throw new Error( ("The template cannot be " + template + ".") );
		}

		// Check the parsed template has a version at all
		else if ( typeof template.v !== 'number' ) {
			throw new Error( 'The template parser was passed a non-string template, but the template doesn\'t have a version.  Make sure you\'re passing in the template you think you are.' );
		}

		// Check we're using the correct version
		else if ( template.v !== TEMPLATE_VERSION ) {
			throw new Error( ("Mismatched template version (expected " + TEMPLATE_VERSION + ", got " + (template.v) + ") Please ensure you are using the latest version of Ractive.js in your build process as well as in your app") );
		}
	}

	function extendPartials ( existingPartials, newPartials, overwrite ) {
		if ( !newPartials ) return;

		// TODO there's an ambiguity here - we need to overwrite in the `reset()`
		// case, but not initially...

		for ( var key in newPartials ) {
			if ( overwrite || !existingPartials.hasOwnProperty( key ) ) {
				existingPartials[ key ] = newPartials[ key ];
			}
		}
	}

	var registryNames = [
		'adaptors',
		'components',
		'computed',
		'decorators',
		'easing',
		'events',
		'interpolators',
		'partials',
		'transitions'
	];

	var Registry = function Registry ( name, useDefaults ) {
		this.name = name;
		this.useDefaults = useDefaults;
	};

	Registry.prototype.extend = function extend ( Parent, proto, options ) {
		this.configure(
			this.useDefaults ? Parent.defaults : Parent,
			this.useDefaults ? proto : proto.constructor,
			options );
	};

	Registry.prototype.init = function init () {
		// noop
	};

	Registry.prototype.configure = function configure ( Parent, target, options ) {
		var name = this.name;
		var option = options[ name ];

		var registry = create( Parent[name] );

		for ( var key in option ) {
			registry[ key ] = option[ key ];
		}

		target[ name ] = registry;
	};

	Registry.prototype.reset = function reset ( ractive ) {
		var registry = ractive[ this.name ];
		var changed = false;

		Object.keys( registry ).forEach( function ( key ) {
			var item = registry[ key ];
				
			if ( item._fn ) {
				if ( item._fn.isOwner ) {
					registry[key] = item._fn;
				} else {
					delete registry[key];
				}
				changed = true;
			}
		});

		return changed;
	};

	var registries = registryNames.map( function ( name ) { return new Registry( name, name === 'computed' ); } );

	function wrap ( parent, name, method ) {
		if ( !/_super/.test( method ) ) return method;

		function wrapper () {
			var superMethod = getSuperMethod( wrapper._parent, name );
			var hasSuper = '_super' in this;
			var oldSuper = this._super;

			this._super = superMethod;

			var result = method.apply( this, arguments );

			if ( hasSuper ) {
				this._super = oldSuper;
			} else {
				delete this._super;
			}

			return result;
		}

		wrapper._parent = parent;
		wrapper._method = method;

		return wrapper;
	}

	function getSuperMethod ( parent, name ) {
		if ( name in parent ) {
			var value = parent[ name ];

			return typeof value === 'function' ?
				value :
				function () { return value; };
		}

		return noop;
	}

	function getMessage( deprecated, correct, isError ) {
		return "options." + deprecated + " has been deprecated in favour of options." + correct + "."
			+ ( isError ? (" You cannot specify both options, please use options." + correct + ".") : '' );
	}

	function deprecateOption ( options, deprecatedOption, correct ) {
		if ( deprecatedOption in options ) {
			if( !( correct in options ) ) {
				warnIfDebug( getMessage( deprecatedOption, correct ) );
				options[ correct ] = options[ deprecatedOption ];
			} else {
				throw new Error( getMessage( deprecatedOption, correct, true ) );
			}
		}
	}

	function deprecate ( options ) {
		deprecateOption( options, 'beforeInit', 'onconstruct' );
		deprecateOption( options, 'init', 'onrender' );
		deprecateOption( options, 'complete', 'oncomplete' );
		deprecateOption( options, 'eventDefinitions', 'events' );

		// Using extend with Component instead of options,
		// like Human.extend( Spider ) means adaptors as a registry
		// gets copied to options. So we have to check if actually an array
		if ( isArray( options.adaptors ) ) {
			deprecateOption( options, 'adaptors', 'adapt' );
		}
	}

	var custom = {
		adapt: adaptConfigurator,
		css: cssConfigurator,
		data: dataConfigurator,
		template: templateConfigurator
	};

	var defaultKeys = Object.keys( defaults );

	var isStandardKey = makeObj( defaultKeys.filter( function ( key ) { return !custom[ key ]; } ) );

	// blacklisted keys that we don't double extend
	var isBlacklisted = makeObj( defaultKeys.concat( registries.map( function ( r ) { return r.name; } ) ) );

	var order = [].concat(
		defaultKeys.filter( function ( key ) { return !registries[ key ] && !custom[ key ]; } ),
		registries,
		//custom.data,
		custom.template,
		custom.css
	);

	var config = {
		extend: function ( Parent, proto, options ) { return configure( 'extend', Parent, proto, options ); },

		init: function ( Parent, ractive, options ) { return configure( 'init', Parent, ractive, options ); },

		reset: function ( ractive ) {
			return order.filter( function ( c ) {
				return c.reset && c.reset( ractive );
			}).map( function ( c ) { return c.name; } );
		},

		// this defines the order. TODO this isn't used anywhere in the codebase,
		// only in the test suite - should get rid of it
		order: order
	};

	function configure ( method, Parent, target, options ) {
		deprecate( options );

		for ( var key in options ) {
			if ( isStandardKey.hasOwnProperty( key ) ) {
				var value = options[ key ];

				// warn the developer if they passed a function and ignore its value

				// NOTE: we allow some functions on "el" because we duck type element lists
				// and some libraries or ef'ed-up virtual browsers (phantomJS) return a
				// function object as the result of querySelector methods
				if ( key !== 'el' && typeof value === 'function' ) {
					warnIfDebug( ("" + key + " is a Ractive option that does not expect a function and will be ignored"),
						method === 'init' ? target : null );
				}
				else {
					target[ key ] = value;
				}
			}
		}

		// disallow combination of `append` and `enhance`
		if ( options.append && options.enhance ) {
			throw new Error( 'Cannot use append and enhance at the same time' );
		}

		registries.forEach( function ( registry ) {
			registry[ method ]( Parent, target, options );
		});

		adaptConfigurator[ method ]( Parent, target, options );
		templateConfigurator[ method ]( Parent, target, options );
		cssConfigurator[ method ]( Parent, target, options );

		extendOtherMethods( Parent.prototype, target, options );
	}

	function extendOtherMethods ( parent, target, options ) {
		for ( var key in options ) {
			if ( !isBlacklisted[ key ] && options.hasOwnProperty( key ) ) {
				var member = options[ key ];

				// if this is a method that overwrites a method, wrap it:
				if ( typeof member === 'function' ) {
					member = wrap( parent, key, member );
				}

				target[ key ] = member;
			}
		}
	}

	function makeObj ( array ) {
		var obj = {};
		array.forEach( function ( x ) { return obj[x] = true; } );
		return obj;
	}

	var shouldRerender = [ 'template', 'partials', 'components', 'decorators', 'events' ];

	var completeHook$1 = new Hook( 'complete' );
	var resetHook = new Hook( 'reset' );
	var renderHook$1 = new Hook( 'render' );
	var unrenderHook = new Hook( 'unrender' );

	function Ractive$reset ( data ) {
		data = data || {};

		if ( typeof data !== 'object' ) {
			throw new Error( 'The reset method takes either no arguments, or an object containing new data' );
		}

		// TEMP need to tidy this up
		data = dataConfigurator.init( this.constructor, this, { data: data });

		var promise = runloop.start( this, true );

		// If the root object is wrapped, try and use the wrapper's reset value
		var wrapper = this.viewmodel.wrapper;
		if ( wrapper && wrapper.reset ) {
			if ( wrapper.reset( data ) === false ) {
				// reset was rejected, we need to replace the object
				this.viewmodel.set( data );
			}
		} else {
			this.viewmodel.set( data );
		}

		// reset config items and track if need to rerender
		var changes = config.reset( this );
		var rerender;

		var i = changes.length;
		while ( i-- ) {
			if ( shouldRerender.indexOf( changes[i] ) > -1 ) {
				rerender = true;
				break;
			}
		}

		if ( rerender ) {
			unrenderHook.fire( this );
			this.fragment.resetTemplate( this.template );
			renderHook$1.fire( this );
			completeHook$1.fire( this );
		}

		runloop.end();

		resetHook.fire( this, data );

		return promise;
	}

	function collect( source, name, attr, dest ) {
		source.forEach( function ( item ) {
			// queue to rerender if the item is a partial and the current name matches
			if ( item.type === PARTIAL && ( item.refName ===  name || item.name === name ) ) {
				item.inAttribute = attr;
				dest.push( item );
				return; // go no further
			}

			// if it has a fragment, process its items
			if ( item.fragment ) {
				collect( item.fragment.iterations || item.fragment.items, name, attr, dest );
			}

			// or if it is itself a fragment, process its items
			else if ( isArray( item.items ) ) {
				collect( item.items, name, attr, dest );
			}

			// or if it is a component, step in and process its items
			else if ( item.type === COMPONENT && item.instance ) {
				// ...unless the partial is shadowed
				if ( item.instance.partials[ name ] ) return;
				collect( item.instance.fragment.items, name, attr, dest );
			}

			// if the item is an element, process its attributes too
			if ( item.type === ELEMENT ) {
				if ( isArray( item.attributes ) ) {
					collect( item.attributes, name, true, dest );
				}
			}
		});
	}

	function forceResetTemplate ( partial ) {
		partial.forceResetTemplate();
	}

	function resetPartial ( name, partial ) {
		var collection = [];
		collect( this.fragment.items, name, false, collection );

		var promise = runloop.start( this, true );

		this.partials[ name ] = partial;
		collection.forEach( forceResetTemplate );

		runloop.end();

		return promise;
	}

	var Item = function Item ( options ) {
		this.parentFragment = options.parentFragment;
		this.ractive = options.parentFragment.ractive;

		this.template = options.template;
		this.index = options.index;
		this.type = options.template.t;

		this.dirty = false;
	};

	Item.prototype.bubble = function bubble () {
		if ( !this.dirty ) {
			this.dirty = true;
			this.parentFragment.bubble();
		}
	};

	Item.prototype.destroyed = function destroyed () {
		if ( this.fragment ) this.fragment.destroyed();
	};

	Item.prototype.find = function find () {
		return null;
	};

	Item.prototype.findAll = function findAll () {
		// noop
	};

	Item.prototype.findComponent = function findComponent () {
		return null;
	};

	Item.prototype.findAllComponents = function findAllComponents () {
		// noop;
	};

	Item.prototype.findNextNode = function findNextNode () {
		return this.parentFragment.findNextNode( this );
	};

	Item.prototype.shuffled = function shuffled () {
		if ( this.fragment ) this.fragment.shuffled();
	};

	Item.prototype.valueOf = function valueOf () {
		return this.toString();
	};

	var ComputationChild = (function (Model) {
		function ComputationChild () {
			Model.apply(this, arguments);
		}

		ComputationChild.prototype = Object.create( Model && Model.prototype );
		ComputationChild.prototype.constructor = ComputationChild;

		ComputationChild.prototype.get = function get ( shouldCapture ) {
			if ( shouldCapture ) capture( this );

			var parentValue = this.parent.get();
			return parentValue ? parentValue[ this.key ] : undefined;
		};

		ComputationChild.prototype.handleChange = function handleChange$1 () {
			this.dirty = true;

			this.links.forEach( marked );
			this.deps.forEach( handleChange );
			this.children.forEach( handleChange );
			this.clearUnresolveds(); // TODO is this necessary?
		};

		ComputationChild.prototype.joinKey = function joinKey ( key ) {
			if ( key === undefined || key === '' ) return this;

			if ( !this.childByKey.hasOwnProperty( key ) ) {
				var child = new ComputationChild( this, key );
				this.children.push( child );
				this.childByKey[ key ] = child;
			}

			return this.childByKey[ key ];
		};

		return ComputationChild;
	}(Model));

	function createResolver ( proxy, ref, index ) {
		var resolver = proxy.fragment.resolve( ref, function ( model ) {
			removeFromArray( proxy.resolvers, resolver );
			proxy.models[ index ] = model;
			proxy.bubble();
		});

		proxy.resolvers.push( resolver );
	}

	var ExpressionProxy = (function (Model) {
		function ExpressionProxy ( fragment, template ) {
			var this$1 = this;

			Model.call( this, fragment.ractive.viewmodel, null );

			this.fragment = fragment;
			this.template = template;

			this.isReadonly = true;
			this.dirty = true;

			this.fn = getFunction( template.s, template.r.length );

			this.resolvers = [];
			this.models = this.template.r.map( function ( ref, index ) {
				var model = resolveReference( this$1.fragment, ref );

				if ( !model ) {
					createResolver( this$1, ref, index );
				}

				return model;
			});
			this.dependencies = [];

			this.shuffle = undefined;

			this.bubble();
		}

		ExpressionProxy.prototype = Object.create( Model && Model.prototype );
		ExpressionProxy.prototype.constructor = ExpressionProxy;

		ExpressionProxy.prototype.bubble = function bubble ( actuallyChanged ) {
			// refresh the keypath
			if ( actuallyChanged === void 0 ) actuallyChanged = true;

			if ( this.registered ) delete this.root.expressions[ this.keypath ];
			this.keypath = undefined;

			if ( actuallyChanged ) {
				this.dirty = true;
				this.handleChange();
			}
		};

		ExpressionProxy.prototype.get = function get ( shouldCapture ) {
			if ( shouldCapture ) capture( this );

			if ( this.dirty ) {
				this.dirty = false;
				this.value = this.getValue();
				if ( this.wrapper ) this.newWrapperValue = this.value;
				this.adapt();
			}

			return shouldCapture && this.wrapper ? this.wrapperValue : this.value;
		};

		ExpressionProxy.prototype.getKeypath = function getKeypath () {
			var this$1 = this;

			if ( !this.template ) return '@undefined';
			if ( !this.keypath ) {
				this.keypath = '@' + this.template.s.replace( /_(\d+)/g, function ( match, i ) {
					if ( i >= this$1.models.length ) return match;

					var model = this$1.models[i];
					return model ? model.getKeypath() : '@undefined';
				});

				this.root.expressions[ this.keypath ] = this;
				this.registered = true;
			}

			return this.keypath;
		};

		ExpressionProxy.prototype.getValue = function getValue () {
			var this$1 = this;

			startCapturing();
			var result;

			try {
				var params = this.models.map( function ( m ) { return m ? m.get( true ) : undefined; } );
				result = this.fn.apply( this.fragment.ractive, params );
			} catch ( err ) {
				warnIfDebug( ("Failed to compute " + (this.getKeypath()) + ": " + (err.message || err)) );
			}

			var dependencies = stopCapturing();
			// remove missing deps
			this.dependencies.filter( function ( d ) { return !~dependencies.indexOf( d ); } ).forEach( function ( d ) {
				d.unregister( this$1 );
				removeFromArray( this$1.dependencies, d );
			});
			// register new deps
			dependencies.filter( function ( d ) { return !~this$1.dependencies.indexOf( d ); } ).forEach( function ( d ) {
				d.register( this$1 );
				this$1.dependencies.push( d );
			});

			return result;
		};

		ExpressionProxy.prototype.handleChange = function handleChange$1 () {
			this.dirty = true;

			this.links.forEach( marked );
			this.deps.forEach( handleChange );
			this.children.forEach( handleChange );

			this.clearUnresolveds();
		};

		ExpressionProxy.prototype.joinKey = function joinKey ( key ) {
			if ( key === undefined || key === '' ) return this;

			if ( !this.childByKey.hasOwnProperty( key ) ) {
				var child = new ComputationChild( this, key );
				this.children.push( child );
				this.childByKey[ key ] = child;
			}

			return this.childByKey[ key ];
		};

		ExpressionProxy.prototype.mark = function mark () {
			this.handleChange();
		};

		ExpressionProxy.prototype.rebinding = function rebinding ( next, previous, safe ) {
			var idx = this.models.indexOf( previous );

			if ( ~idx ) {
				next = rebindMatch( this.template.r[idx], next, previous );
				if ( next !== previous ) {
					previous.unregister( this );
					this.models.splice( idx, 1, next );
					// TODO: set up a resolver if there is no next?
					if ( next ) next.addShuffleRegister( this, 'mark' );
				}
			}
			this.bubble( !safe );
		};

		ExpressionProxy.prototype.retrieve = function retrieve () {
			return this.get();
		};

		ExpressionProxy.prototype.teardown = function teardown () {
			var this$1 = this;

			this.unbind();
			this.fragment = undefined;
			if ( this.dependencies ) this.dependencies.forEach( function ( d ) { return d.unregister( this$1 ); } );
			Model.prototype.teardown.call(this);
		};

		ExpressionProxy.prototype.unregister = function unregister( dep ) {
			Model.prototype.unregister.call( this, dep );
			if ( !this.deps.length ) this.teardown();
		};

		ExpressionProxy.prototype.unbind = function unbind$1 () {
			this.resolvers.forEach( unbind );
		};

		return ExpressionProxy;
	}(Model));

	var ReferenceExpressionChild = (function (Model) {
		function ReferenceExpressionChild ( parent, key ) {
			Model.call ( this, parent, key );
		}

		ReferenceExpressionChild.prototype = Object.create( Model && Model.prototype );
		ReferenceExpressionChild.prototype.constructor = ReferenceExpressionChild;

		ReferenceExpressionChild.prototype.applyValue = function applyValue ( value ) {
			if ( isEqual( value, this.value ) ) return;

			var parent = this.parent, keys = [ this.key ];
			while ( parent ) {
				if ( parent.base ) {
					var target = parent.model.joinAll( keys );
					target.applyValue( value );
					break;
				}

				keys.unshift( parent.key );

				parent = parent.parent;
			}
		};

		ReferenceExpressionChild.prototype.joinKey = function joinKey ( key ) {
			if ( key === undefined || key === '' ) return this;

			if ( !this.childByKey.hasOwnProperty( key ) ) {
				var child = new ReferenceExpressionChild( this, key );
				this.children.push( child );
				this.childByKey[ key ] = child;
			}

			return this.childByKey[ key ];
		};

		ReferenceExpressionChild.prototype.retrieve = function retrieve () {
			var parent = this.parent.get();
			return parent && parent[ this.key ];
		};

		return ReferenceExpressionChild;
	}(Model));

	var ReferenceExpressionProxy = (function (Model) {
		function ReferenceExpressionProxy ( fragment, template ) {
			var this$1 = this;

			Model.call( this, null, null );
			this.dirty = true;
			this.root = fragment.ractive.viewmodel;
			this.template = template;

			this.resolvers = [];

			this.base = resolve$2( fragment, template );
			var baseResolver;

			if ( !this.base ) {
				baseResolver = fragment.resolve( template.r, function ( model ) {
					this$1.base = model;
					this$1.bubble();

					removeFromArray( this$1.resolvers, baseResolver );
				});

				this.resolvers.push( baseResolver );
			}

			var intermediary = this.intermediary = {
				handleChange: function () { return this$1.handleChange(); },
				rebinding: function ( next, previous ) {
					if ( previous === this$1.base ) {
						next = rebindMatch( template, next, previous );
						if ( next !== this$1.base ) {
							this$1.base.unregister( intermediary );
							this$1.base = next;
							// TODO: if there is no next, set up a resolver?
						}
					} else {
						var idx = this$1.members.indexOf( previous );
						if ( ~idx ) {
							// only direct references will rebind... expressions handle themselves
							next = rebindMatch( template.m[idx].n, next, previous );
							if ( next !== this$1.members[idx] ) {
								this$1.members.splice( idx, 1, next );
								// TODO: if there is no next, set up a resolver?
							}
						}
					}

					if ( next !== previous ) previous.unregister( intermediary );
					if ( next ) next.addShuffleTask( function () { return next.register( intermediary ); } );

					this$1.bubble();
				}
			};

			this.members = template.m.map( function ( template, i ) {
				if ( typeof template === 'string' ) {
					return { get: function () { return template; } };
				}

				var model;
				var resolver;

				if ( template.t === REFERENCE ) {
					model = resolveReference( fragment, template.n );

					if ( model ) {
						model.register( intermediary );
					} else {
						resolver = fragment.resolve( template.n, function ( model ) {
							this$1.members[i] = model;

							model.register( intermediary );
							this$1.handleChange();

							removeFromArray( this$1.resolvers, resolver );
						});

						this$1.resolvers.push( resolver );
					}

					return model;
				}

				model = new ExpressionProxy( fragment, template );
				model.register( intermediary );
				return model;
			});

			this.isUnresolved = true;
			this.bubble();
		}

		ReferenceExpressionProxy.prototype = Object.create( Model && Model.prototype );
		ReferenceExpressionProxy.prototype.constructor = ReferenceExpressionProxy;

		ReferenceExpressionProxy.prototype.bubble = function bubble () {
			if ( !this.base ) return;
			if ( !this.dirty ) this.handleChange();
		};

		ReferenceExpressionProxy.prototype.forceResolution = function forceResolution () {
			this.resolvers.forEach( function ( resolver ) { return resolver.forceResolution(); } );
			this.dirty = true;
			this.bubble();
		};

		ReferenceExpressionProxy.prototype.get = function get ( shouldCapture ) {
			var this$1 = this;

			if ( this.dirty ) {
				this.bubble();

				var i = this.members.length, resolved = true;
				while ( resolved && i-- ) {
					if ( !this$1.members[i] ) resolved = false;
				}

				if ( this.base && resolved ) {
					var keys = this.members.map( function ( m ) { return escapeKey( String( m.get() ) ); } );
					var model = this.base.joinAll( keys );

					if ( model !== this.model ) {
						if ( this.model ) {
							this.model.unregister( this );
							this.model.unregisterTwowayBinding( this );
						}

						this.model = model;
						this.parent = model.parent;
						this.model.register( this );
						this.model.registerTwowayBinding( this );

						if ( this.keypathModel ) this.keypathModel.handleChange();
					}
				}

				this.value = this.model ? this.model.get( shouldCapture ) : undefined;
				this.dirty = false;
				this.mark();
				return this.value;
			} else {
				return this.model ? this.model.get( shouldCapture ) : undefined;
			}
		};

		// indirect two-way bindings
		ReferenceExpressionProxy.prototype.getValue = function getValue () {
			var this$1 = this;

			this.value = this.model ? this.model.get() : undefined;

			var i = this.bindings.length;
			while ( i-- ) {
				var value = this$1.bindings[i].getValue();
				if ( value !== this$1.value ) return value;
			}

			// check one-way bindings
			var oneway = findBoundValue( this.deps );
			if ( oneway ) return oneway.value;

			return this.value;
		};

		ReferenceExpressionProxy.prototype.getKeypath = function getKeypath () {
			return this.model ? this.model.getKeypath() : '@undefined';
		};

		ReferenceExpressionProxy.prototype.handleChange = function handleChange$1 () {
			this.dirty = true;
			this.mark();
		};

		ReferenceExpressionProxy.prototype.joinKey = function joinKey ( key ) {
			if ( key === undefined || key === '' ) return this;

			if ( !this.childByKey.hasOwnProperty( key ) ) {
				var child = new ReferenceExpressionChild( this, key );
				this.children.push( child );
				this.childByKey[ key ] = child;
			}

			return this.childByKey[ key ];
		};

		ReferenceExpressionProxy.prototype.mark = function mark$1 () {
			if ( this.dirty ) {
				this.deps.forEach( handleChange );
			}

			this.links.forEach( marked );
			this.children.forEach( mark );
			this.clearUnresolveds();
		};

		ReferenceExpressionProxy.prototype.retrieve = function retrieve () {
			return this.value;
		};

		ReferenceExpressionProxy.prototype.rebinding = function rebinding () { }; // NOOP

		ReferenceExpressionProxy.prototype.set = function set ( value ) {
			if ( !this.model ) throw new Error( 'Unresolved reference expression. This should not happen!' );
			this.model.set( value );
		};

		ReferenceExpressionProxy.prototype.unbind = function unbind$1 () {
			this.resolvers.forEach( unbind );
			if ( this.model ) {
				this.model.unregister( this );
				this.model.unregisterTwowayBinding( this );
			}
		};

		return ReferenceExpressionProxy;
	}(Model));

	function resolve$2 ( fragment, template ) {
		if ( template.r ) {
			return resolveReference( fragment, template.r );
		}

		else if ( template.x ) {
			return new ExpressionProxy( fragment, template.x );
		}

		else if ( template.rx ) {
			return new ReferenceExpressionProxy( fragment, template.rx );
		}
	}

	function resolveAliases( section ) {
		if ( section.template.z ) {
			section.aliases = {};

			var refs = section.template.z;
			for ( var i = 0; i < refs.length; i++ ) {
				section.aliases[ refs[i].n ] = resolve$2( section.parentFragment, refs[i].x );
			}
		}
	}

	var Alias = (function (Item) {
		function Alias ( options ) {
			Item.call( this, options );

			this.fragment = null;
		}

		Alias.prototype = Object.create( Item && Item.prototype );
		Alias.prototype.constructor = Alias;

		Alias.prototype.bind = function bind () {
			resolveAliases( this );

			this.fragment = new Fragment({
				owner: this,
				template: this.template.f
			}).bind();
		};

		Alias.prototype.detach = function detach () {
			return this.fragment ? this.fragment.detach() : createDocumentFragment();
		};

		Alias.prototype.find = function find ( selector ) {
			if ( this.fragment ) {
				return this.fragment.find( selector );
			}
		};

		Alias.prototype.findAll = function findAll ( selector, query ) {
			if ( this.fragment ) {
				this.fragment.findAll( selector, query );
			}
		};

		Alias.prototype.findComponent = function findComponent ( name ) {
			if ( this.fragment ) {
				return this.fragment.findComponent( name );
			}
		};

		Alias.prototype.findAllComponents = function findAllComponents ( name, query ) {
			if ( this.fragment ) {
				this.fragment.findAllComponents( name, query );
			}
		};

		Alias.prototype.firstNode = function firstNode ( skipParent ) {
			return this.fragment && this.fragment.firstNode( skipParent );
		};

		Alias.prototype.rebinding = function rebinding () {
			var this$1 = this;

			if ( this.locked ) return;
			this.locked = true;
			runloop.scheduleTask( function () {
				this$1.locked = false;
				resolveAliases( this$1 );
			});
		};

		Alias.prototype.render = function render ( target ) {
			this.rendered = true;
			if ( this.fragment ) this.fragment.render( target );
		};

		Alias.prototype.toString = function toString ( escape ) {
			return this.fragment ? this.fragment.toString( escape ) : '';
		};

		Alias.prototype.unbind = function unbind () {
			this.aliases = {};
			if ( this.fragment ) this.fragment.unbind();
		};

		Alias.prototype.unrender = function unrender ( shouldDestroy ) {
			if ( this.rendered && this.fragment ) this.fragment.unrender( shouldDestroy );
			this.rendered = false;
		};

		Alias.prototype.update = function update () {
			if ( this.dirty ) {
				this.dirty = false;
				this.fragment.update();
			}
		};

		return Alias;
	}(Item));

	function findElement( start, orComponent, name ) {
		if ( orComponent === void 0 ) orComponent = true;

		while ( start && ( start.type !== ELEMENT || ( name && start.name !== name ) ) && ( !orComponent || start.type !== COMPONENT ) ) {
			// start is a fragment - look at the owner
			if ( start.owner ) start = start.owner;
			// start is a component or yielder - look at the container
			else if ( start.component ) start = start.containerFragment || start.component.parentFragment;
			// start is an item - look at the parent
			else if ( start.parent ) start = start.parent;
			// start is an item without a parent - look at the parent fragment
			else if ( start.parentFragment ) start = start.parentFragment;

			else start = undefined;
		}

		return start;
	}

	var space = /\s+/;
	var remove$1 = /\/\*(?:[\s\S]*?)\*\//g;
	var escape$1 = /url\(\s*(['"])(?:\\[\s\S]|(?!\1).)*\1\s*\)|url\((?:\\[\s\S]|[^)])*\)|(['"])(?:\\[\s\S]|(?!\1).)*\2/gi;
	var value$1 = /\0(\d+)/g;

	function readStyle ( css ) {
		var values = [];

		if ( typeof css !== 'string' ) return {};

		return css.replace( escape$1, function ( match ) { return ("\u0000" + (values.push( match ) - 1)); })
			.replace( remove$1, '' )
			.split( ';' )
			.filter( function ( rule ) { return !!rule.trim(); } )
			.map( function ( rule ) { return rule.replace( value$1, function ( match, n ) { return values[ n ]; } ); } )
			.reduce(function ( rules, rule ) {
				var i = rule.indexOf(':');
				var name = rule.substr( 0, i ).trim();
				rules[ name ] = rule.substr( i + 1 ).trim();
				return rules;
			}, {});
	}

	function readClass ( str ) {
		var list = str.split( space );

		// remove any empty entries
		var i = list.length;
		while ( i-- ) {
			if ( !list[i] ) list.splice( i, 1 );
		}

		return list;
	}

	var textTypes = [ undefined, 'text', 'search', 'url', 'email', 'hidden', 'password', 'search', 'reset', 'submit' ];

	function getUpdateDelegate ( attribute ) {
		var element = attribute.element, name = attribute.name;

		if ( name === 'id' ) return updateId;

		if ( name === 'value' ) {
			if ( attribute.interpolator ) attribute.interpolator.bound = true;

			// special case - selects
			if ( element.name === 'select' && name === 'value' ) {
				return element.getAttribute( 'multiple' ) ? updateMultipleSelectValue : updateSelectValue;
			}

			if ( element.name === 'textarea' ) return updateStringValue;

			// special case - contenteditable
			if ( element.getAttribute( 'contenteditable' ) != null ) return updateContentEditableValue;

			// special case - <input>
			if ( element.name === 'input' ) {
				var type = element.getAttribute( 'type' );

				// type='file' value='{{fileList}}'>
				if ( type === 'file' ) return noop; // read-only

				// type='radio' name='{{twoway}}'
				if ( type === 'radio' && element.binding && element.binding.attribute.name === 'name' ) return updateRadioValue;

				if ( ~textTypes.indexOf( type ) ) return updateStringValue;
			}

			return updateValue;
		}

		var node = element.node;

		// special case - <input type='radio' name='{{twoway}}' value='foo'>
		if ( attribute.isTwoway && name === 'name' ) {
			if ( node.type === 'radio' ) return updateRadioName;
			if ( node.type === 'checkbox' ) return updateCheckboxName;
		}

		if ( name === 'style' ) return updateStyleAttribute;

		if ( name.indexOf( 'style-' ) === 0 ) return updateInlineStyle;

		// special case - class names. IE fucks things up, again
		if ( name === 'class' && ( !node.namespaceURI || node.namespaceURI === html ) ) return updateClassName;

		if ( name.indexOf( 'class-' ) === 0 ) return updateInlineClass;

		if ( attribute.isBoolean ) {
			var type$1 = element.getAttribute( 'type' );
			if ( attribute.interpolator && name === 'checked' && ( type$1 === 'checkbox' || type$1 === 'radio' ) ) attribute.interpolator.bound = true;
			return updateBoolean;
		}

		if ( attribute.namespace && attribute.namespace !== attribute.node.namespaceURI ) return updateNamespacedAttribute;

		return updateAttribute;
	}

	function updateId ( reset ) {
		var ref = this, node = ref.node;
		var value = this.getValue();

		// remove the mapping to this node if it hasn't already been replaced
		if ( this.ractive.nodes[ node.id ] === node ) delete this.ractive.nodes[ node.id ];
		if ( reset ) return node.removeAttribute( 'id' );

		this.ractive.nodes[ value ] = node;

		node.id = value;
	}

	function updateMultipleSelectValue ( reset ) {
		var value = this.getValue();

		if ( !isArray( value ) ) value = [ value ];

		var options = this.node.options;
		var i = options.length;

		if ( reset ) {
			while ( i-- ) options[i].selected = false;
		} else {
			while ( i-- ) {
				var option = options[i];
				var optionValue = option._ractive ?
					option._ractive.value :
					option.value; // options inserted via a triple don't have _ractive

				option.selected = arrayContains( value, optionValue );
			}
		}
	}

	function updateSelectValue ( reset ) {
		var value = this.getValue();

		if ( !this.locked ) { // TODO is locked still a thing?
			this.node._ractive.value = value;

			var options = this.node.options;
			var i = options.length;
			var wasSelected = false;

			if ( reset ) {
				while ( i-- ) options[i].selected = false;
			} else {
				while ( i-- ) {
					var option = options[i];
					var optionValue = option._ractive ?
						option._ractive.value :
						option.value; // options inserted via a triple don't have _ractive
					if ( option.disabled && option.selected ) wasSelected = true;

					if ( optionValue == value ) { // double equals as we may be comparing numbers with strings
						option.selected = true;
						return;
					}
				}
			}

			if ( !wasSelected ) this.node.selectedIndex = -1;
		}
	}


	function updateContentEditableValue ( reset ) {
		var value = this.getValue();

		if ( !this.locked ) {
			if ( reset ) this.node.innerHTML = '';
			else this.node.innerHTML = value === undefined ? '' : value;
		}
	}

	function updateRadioValue ( reset ) {
		var node = this.node;
		var wasChecked = node.checked;

		var value = this.getValue();

		if ( reset ) return node.checked = false;

		//node.value = this.element.getAttribute( 'value' );
		node.value = this.node._ractive.value = value;
		node.checked = value === this.element.getAttribute( 'name' );

		// This is a special case - if the input was checked, and the value
		// changed so that it's no longer checked, the twoway binding is
		// most likely out of date. To fix it we have to jump through some
		// hoops... this is a little kludgy but it works
		if ( wasChecked && !node.checked && this.element.binding && this.element.binding.rendered ) {
			this.element.binding.group.model.set( this.element.binding.group.getValue() );
		}
	}

	function updateValue ( reset ) {
		if ( !this.locked ) {
			if ( reset ) {
				this.node.removeAttribute( 'value' );
				this.node.value = this.node._ractive.value = null;
				return;
			}

			var value = this.getValue();

			this.node.value = this.node._ractive.value = value;
			this.node.setAttribute( 'value', value );
		}
	}

	function updateStringValue ( reset ) {
		if ( !this.locked ) {
			if ( reset ) {
				this.node._ractive.value = '';
				this.node.removeAttribute( 'value' );
				return;
			}

			var value = this.getValue();

			this.node._ractive.value = value;

			this.node.value = safeToStringValue( value );
			this.node.setAttribute( 'value', safeToStringValue( value ) );
		}
	}

	function updateRadioName ( reset ) {
		if ( reset ) this.node.checked = false;
		else this.node.checked = ( this.getValue() == this.node._ractive.value );
	}

	function updateCheckboxName ( reset ) {
		var ref = this, element = ref.element, node = ref.node;
		var binding = element.binding;

		var value = this.getValue();
		var valueAttribute = element.getAttribute( 'value' );

		if ( reset ) {
			// TODO: WAT?
		}

		if ( !isArray( value ) ) {
			binding.isChecked = node.checked = ( value == valueAttribute );
		} else {
			var i = value.length;
			while ( i-- ) {
				if ( valueAttribute == value[i] ) {
					binding.isChecked = node.checked = true;
					return;
				}
			}
			binding.isChecked = node.checked = false;
		}
	}

	function updateStyleAttribute ( reset ) {
		var props = reset ? {} : readStyle( this.getValue() || '' );
		var style = this.node.style;
		var keys = Object.keys( props );
		var prev = this.previous || [];

		var i = 0;
		while ( i < keys.length ) {
			if ( keys[i] in style ) {
				var safe = props[ keys[i] ].replace( '!important', '' );
				style.setProperty( keys[i], safe, safe.length !== props[ keys[i] ].length ? 'important' : '' );
			}
			i++;
		}

		// remove now-missing attrs
		i = prev.length;
		while ( i-- ) {
			if ( !~keys.indexOf( prev[i] ) && prev[i] in style ) style.setProperty( prev[i], '', '' );
		}

		this.previous = keys;
	}

	function updateInlineStyle ( reset ) {
		if ( !this.style ) {
			this.style = decamelize( this.name.substr( 6 ) );
		}

		var value = reset ? '' : safeToStringValue( this.getValue() );
		var safe = value.replace( '!important', '' );
		this.node.style.setProperty( this.style, safe, safe.length !== value.length ? 'important' : '' );
	}

	function updateClassName ( reset ) {
		var value = reset ? [] : readClass( safeToStringValue( this.getValue() ) );
		var attr = readClass( this.node.className );
		var prev = this.previous || attr.slice( 0 );

		var i = 0;
		while ( i < value.length ) {
			if ( !~attr.indexOf( value[i] ) ) attr.push( value[i] );
			i++;
		}

		// remove now-missing classes
		i = prev.length;
		while ( i-- ) {
			if ( !~value.indexOf( prev[i] ) ) {
				var idx = attr.indexOf( prev[i] );
				if ( ~idx ) attr.splice( idx, 1 );
			}
		}

		var className = attr.join( ' ' );

		if ( className !== this.node.className ) {
			this.node.className = className;
		}

		this.previous = value;
	}

	function updateInlineClass ( reset ) {
		var name = this.name.substr( 6 );
		var attr = readClass( this.node.className );
		var value = reset ? false : this.getValue();

		if ( !this.inlineClass ) this.inlineClass = name;

		if ( value && !~attr.indexOf( name ) ) attr.push( name );
		else if ( !value && ~attr.indexOf( name ) ) attr.splice( attr.indexOf( name ), 1 );

		this.node.className = attr.join( ' ' );
	}

	function updateBoolean ( reset ) {
		// with two-way binding, only update if the change wasn't initiated by the user
		// otherwise the cursor will often be sent to the wrong place
		if ( !this.locked ) {
			if ( reset ) {
				if ( this.useProperty ) this.node[ this.propertyName ] = false;
				this.node.removeAttribute( this.propertyName );
				return;
			}

			if ( this.useProperty ) {
				this.node[ this.propertyName ] = this.getValue();
			} else {
				if ( this.getValue() ) {
					this.node.setAttribute( this.propertyName, '' );
				} else {
					this.node.removeAttribute( this.propertyName );
				}
			}
		}
	}

	function updateAttribute ( reset ) {
		if ( reset ) this.node.removeAttribute( this.name );
		else this.node.setAttribute( this.name, safeToStringValue( this.getString() ) );
	}

	function updateNamespacedAttribute ( reset ) {
		if ( reset ) this.node.removeAttributeNS( this.namespace, this.name.slice( this.name.indexOf( ':' ) + 1 ) );
		else this.node.setAttributeNS( this.namespace, this.name.slice( this.name.indexOf( ':' ) + 1 ), safeToStringValue( this.getString() ) );
	}

	var propertyNames = {
		'accept-charset': 'acceptCharset',
		accesskey: 'accessKey',
		bgcolor: 'bgColor',
		'class': 'className',
		codebase: 'codeBase',
		colspan: 'colSpan',
		contenteditable: 'contentEditable',
		datetime: 'dateTime',
		dirname: 'dirName',
		'for': 'htmlFor',
		'http-equiv': 'httpEquiv',
		ismap: 'isMap',
		maxlength: 'maxLength',
		novalidate: 'noValidate',
		pubdate: 'pubDate',
		readonly: 'readOnly',
		rowspan: 'rowSpan',
		tabindex: 'tabIndex',
		usemap: 'useMap'
	};

	function lookupNamespace ( node, prefix ) {
		var qualified = "xmlns:" + prefix;

		while ( node ) {
			if ( node.hasAttribute && node.hasAttribute( qualified ) ) return node.getAttribute( qualified );
			node = node.parentNode;
		}

		return namespaces[ prefix ];
	}

	var attribute = false;
	function inAttribute () { return attribute; }

	var Attribute = (function (Item) {
		function Attribute ( options ) {
			Item.call( this, options );

			this.name = options.template.n;
			this.namespace = null;

			this.owner = options.owner || options.parentFragment.owner || options.element || findElement( options.parentFragment );
			this.element = options.element || (this.owner.attributeByName ? this.owner : findElement( options.parentFragment ) );
			this.parentFragment = options.parentFragment; // shared
			this.ractive = this.parentFragment.ractive;

			this.rendered = false;
			this.updateDelegate = null;
			this.fragment = null;

			this.element.attributeByName[ this.name ] = this;

			if ( !isArray( options.template.f ) ) {
				this.value = options.template.f;
				if ( this.value === 0 ) {
					this.value = '';
				}
			} else {
				this.fragment = new Fragment({
					owner: this,
					template: options.template.f
				});
			}

			this.interpolator = this.fragment &&
				this.fragment.items.length === 1 &&
				this.fragment.items[0].type === INTERPOLATOR &&
				this.fragment.items[0];

			if ( this.interpolator ) this.interpolator.owner = this;
		}

		Attribute.prototype = Object.create( Item && Item.prototype );
		Attribute.prototype.constructor = Attribute;

		Attribute.prototype.bind = function bind () {
			if ( this.fragment ) {
				this.fragment.bind();
			}
		};

		Attribute.prototype.bubble = function bubble () {
			if ( !this.dirty ) {
				this.parentFragment.bubble();
				this.element.bubble();
				this.dirty = true;
			}
		};

		Attribute.prototype.destroyed = function destroyed () {
			this.updateDelegate( true );
		};

		Attribute.prototype.getString = function getString () {
			attribute = true;
			var value = this.fragment ?
				this.fragment.toString() :
				this.value != null ? '' + this.value : '';
			attribute = false;
			return value;
		};

		// TODO could getValue ever be called for a static attribute,
		// or can we assume that this.fragment exists?
		Attribute.prototype.getValue = function getValue () {
			attribute = true;
			var value = this.fragment ? this.fragment.valueOf() : booleanAttributes.test( this.name ) ? true : this.value;
			attribute = false;
			return value;
		};

		Attribute.prototype.render = function render () {
			var node = this.element.node;
			this.node = node;

			// should we use direct property access, or setAttribute?
			if ( !node.namespaceURI || node.namespaceURI === namespaces.html ) {
				this.propertyName = propertyNames[ this.name ] || this.name;

				if ( node[ this.propertyName ] !== undefined ) {
					this.useProperty = true;
				}

				// is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
				// node.selected = true rather than node.setAttribute( 'selected', '' )
				if ( booleanAttributes.test( this.name ) || this.isTwoway ) {
					this.isBoolean = true;
				}

				if ( this.propertyName === 'value' ) {
					node._ractive.value = this.value;
				}
			}

			if ( node.namespaceURI ) {
				var index = this.name.indexOf( ':' );
				if ( index !== -1 ) {
					this.namespace = lookupNamespace( node, this.name.slice( 0, index ) );
				} else {
					this.namespace = node.namespaceURI;
				}
			}

			this.rendered = true;
			this.updateDelegate = getUpdateDelegate( this );
			this.updateDelegate();
		};

		Attribute.prototype.toString = function toString () {
			attribute = true;

			var value = this.getValue();

			// Special case - select and textarea values (should not be stringified)
			if ( this.name === 'value' && ( this.element.getAttribute( 'contenteditable' ) !== undefined || ( this.element.name === 'select' || this.element.name === 'textarea' ) ) ) {
				return;
			}

			// Special case – bound radio `name` attributes
			if ( this.name === 'name' && this.element.name === 'input' && this.interpolator && this.element.getAttribute( 'type' ) === 'radio' ) {
				return ("name=\"{{" + (this.interpolator.model.getKeypath()) + "}}\"");
			}

			// Special case - style and class attributes and directives
			if ( this.owner === this.element && ( this.name === 'style' || this.name === 'class' || this.style || this.inlineClass ) ) {
				return;
			}

			if ( !this.rendered && this.owner === this.element && ( !this.name.indexOf( 'style-' ) || !this.name.indexOf( 'class-' ) ) ) {
				if ( !this.name.indexOf( 'style-' ) ) {
					this.style = decamelize( this.name.substr( 6 ) );
				} else {
					this.inlineClass = this.name.substr( 6 );
				}

				return;
			}

			if ( booleanAttributes.test( this.name ) ) return value ? this.name : '';
			if ( value == null ) return '';

			var str = safeAttributeString( this.getString() );
			attribute = false;

			return str ?
				("" + (this.name) + "=\"" + str + "\"") :
				this.name;
		};

		Attribute.prototype.unbind = function unbind () {
			if ( this.fragment ) this.fragment.unbind();
		};

		Attribute.prototype.unrender = function unrender () {
			this.updateDelegate( true );

			this.rendered = false;
		};

		Attribute.prototype.update = function update () {
			if ( this.dirty ) {
				this.dirty = false;
				if ( this.fragment ) this.fragment.update();
				if ( this.rendered ) this.updateDelegate();
				if ( this.isTwoway && !this.locked ) {
					this.interpolator.twowayBinding.lastVal( true, this.interpolator.model.get() );
				}
			}
		};

		return Attribute;
	}(Item));

	var BindingFlag = (function (Item) {
		function BindingFlag ( options ) {
			Item.call( this, options );

			this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
			this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment );
			this.flag = options.template.v === 'l' ? 'lazy' : 'twoway';

			if ( this.element.type === ELEMENT ) {
				if ( isArray( options.template.f ) ) {
					this.fragment = new Fragment({
						owner: this,
						template: options.template.f
					});
				}

				this.interpolator = this.fragment &&
									this.fragment.items.length === 1 &&
									this.fragment.items[0].type === INTERPOLATOR &&
									this.fragment.items[0];
			}
		}

		BindingFlag.prototype = Object.create( Item && Item.prototype );
		BindingFlag.prototype.constructor = BindingFlag;

		BindingFlag.prototype.bind = function bind () {
			if ( this.fragment ) this.fragment.bind();
			set$2( this, this.getValue(), true );
		};

		BindingFlag.prototype.bubble = function bubble () {
			if ( !this.dirty ) {
				this.element.bubble();
				this.dirty = true;
			}
		};

		BindingFlag.prototype.getValue = function getValue () {
			if ( this.fragment ) return this.fragment.valueOf();
			else if ( 'value' in this ) return this.value;
			else if ( 'f' in this.template ) return this.template.f;
			else return true;
		};

		BindingFlag.prototype.render = function render () {
			set$2( this, this.getValue(), true );
		};

		BindingFlag.prototype.toString = function toString () { return ''; };

		BindingFlag.prototype.unbind = function unbind () {
			if ( this.fragment ) this.fragment.unbind();

			delete this.element[ this.flag ];
		};

		BindingFlag.prototype.unrender = function unrender () {
			if ( this.element.rendered ) this.element.recreateTwowayBinding();
		};

		BindingFlag.prototype.update = function update () {
			if ( this.dirty ) {
				if ( this.fragment ) this.fragment.update();
				set$2( this, this.getValue(), true );
			}
		};

		return BindingFlag;
	}(Item));

	function set$2 ( flag, value, update ) {
		if ( value === 0 ) {
			flag.value = true;
		} else if ( value === 'true' ) {
			flag.value = true;
		} else if ( value === 'false' || value === '0' ) {
			flag.value = false;
		} else {
			flag.value = value;
		}

		var current = flag.element[ flag.flag ];
		flag.element[ flag.flag ] = flag.value;
		if ( update && !flag.element.attributes.binding && current !== flag.value ) {
			flag.element.recreateTwowayBinding();
		}

		return flag.value;
	}

	var div$1 = doc ? createElement( 'div' ) : null;

	var attributes = false;
	function inAttributes() { return attributes; }
	function doInAttributes( fn ) {
		attributes = true;
		fn();
		attributes = false;
	}

	var ConditionalAttribute = (function (Item) {
		function ConditionalAttribute ( options ) {
			Item.call( this, options );

			this.attributes = [];

			this.owner = options.owner;

			this.fragment = new Fragment({
				ractive: this.ractive,
				owner: this,
				template: this.template
			});
			// this fragment can't participate in node-y things
			this.fragment.findNextNode = noop;

			this.dirty = false;
		}

		ConditionalAttribute.prototype = Object.create( Item && Item.prototype );
		ConditionalAttribute.prototype.constructor = ConditionalAttribute;

		ConditionalAttribute.prototype.bind = function bind () {
			this.fragment.bind();
		};

		ConditionalAttribute.prototype.bubble = function bubble () {
			if ( !this.dirty ) {
				this.dirty = true;
				this.owner.bubble();
			}
		};

		ConditionalAttribute.prototype.render = function render () {
			this.node = this.owner.node;
			if ( this.node ) {
				this.isSvg = this.node.namespaceURI === svg$1;
			}

			attributes = true;
			if ( !this.rendered ) this.fragment.render();
			attributes = false;

			this.rendered = true;
			this.dirty = true; // TODO this seems hacky, but necessary for tests to pass in browser AND node.js
			this.update();
		};

		ConditionalAttribute.prototype.toString = function toString () {
			return this.fragment.toString();
		};

		ConditionalAttribute.prototype.unbind = function unbind () {
			this.fragment.unbind();
		};

		ConditionalAttribute.prototype.unrender = function unrender () {
			this.rendered = false;
			this.fragment.unrender();
		};

		ConditionalAttribute.prototype.update = function update () {
			var this$1 = this;

			var str;
			var attrs;

			if ( this.dirty ) {
				this.dirty = false;

				attributes = true;
				this.fragment.update();
				attributes = false;

				if ( this.rendered && this.node ) {
					str = this.fragment.toString();
					attrs = parseAttributes( str, this.isSvg );

					// any attributes that previously existed but no longer do
					// must be removed
					this.attributes.filter( function ( a ) { return notIn( attrs, a ); } ).forEach( function ( a ) {
						this$1.node.removeAttribute( a.name );
					});

					attrs.forEach( function ( a ) {
						this$1.node.setAttribute( a.name, a.value );
					});

					this.attributes = attrs;
				}
			}
		};

		return ConditionalAttribute;
	}(Item));

	function parseAttributes ( str, isSvg ) {
		var tagName = isSvg ? 'svg' : 'div';
		return str
			? (div$1.innerHTML = "<" + tagName + " " + str + "></" + tagName + ">") &&
				toArray(div$1.childNodes[0].attributes)
			: [];
	}

	function notIn ( haystack, needle ) {
		var i = haystack.length;

		while ( i-- ) {
			if ( haystack[i].name === needle.name ) {
				return false;
			}
		}

		return true;
	}

	function processWrapper ( wrapper, array, methodName, newIndices ) {
		var __model = wrapper.__model;

		if ( newIndices ) {
			__model.shuffle( newIndices );
		} else {
			// If this is a sort or reverse, we just do root.set()...
			// TODO use merge logic?
			//root.viewmodel.mark( keypath );
		}
	}

	var mutatorMethods = [ 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift' ];
	var patchedArrayProto = [];

	mutatorMethods.forEach( function ( methodName ) {
		var method = function () {
			var this$1 = this;
			var args = [], len = arguments.length;
			while ( len-- ) args[ len ] = arguments[ len ];

			var newIndices = getNewIndices( this.length, methodName, args );

			// lock any magic array wrappers, so that things don't get fudged
			this._ractive.wrappers.forEach( function ( r ) { if ( r.magic ) r.magic.locked = true; } );

			// apply the underlying method
			var result = Array.prototype[ methodName ].apply( this, arguments );

			// trigger changes
			runloop.start();

			this._ractive.setting = true;
			var i = this._ractive.wrappers.length;
			while ( i-- ) {
				processWrapper( this$1._ractive.wrappers[i], this$1, methodName, newIndices );
			}

			runloop.end();

			this._ractive.setting = false;

			// unlock the magic arrays... magic... bah
			this._ractive.wrappers.forEach( function ( r ) { if ( r.magic ) r.magic.locked = false; } );

			return result;
		};

		defineProperty( patchedArrayProto, methodName, {
			value: method,
			configurable: true
		});
	});

	var patchArrayMethods;
	var unpatchArrayMethods;

	// can we use prototype chain injection?
	// http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection
	if ( ({}).__proto__ ) {
		// yes, we can
		patchArrayMethods = function ( array ) { return array.__proto__ = patchedArrayProto; };
		unpatchArrayMethods = function ( array ) { return array.__proto__ = Array.prototype; };
	}

	else {
		// no, we can't
		patchArrayMethods = function ( array ) {
			var i = mutatorMethods.length;
			while ( i-- ) {
				var methodName = mutatorMethods[i];
				defineProperty( array, methodName, {
					value: patchedArrayProto[ methodName ],
					configurable: true
				});
			}
		};

		unpatchArrayMethods = function ( array ) {
			var i = mutatorMethods.length;
			while ( i-- ) {
				delete array[ mutatorMethods[i] ];
			}
		};
	}

	patchArrayMethods.unpatch = unpatchArrayMethods; // TODO export separately?
	var patch = patchArrayMethods;

	var errorMessage$1 = 'Something went wrong in a rather interesting way';

	var arrayAdaptor = {
		filter: function ( object ) {
			// wrap the array if a) b) it's an array, and b) either it hasn't been wrapped already,
			// or the array didn't trigger the get() itself
			return isArray( object ) && ( !object._ractive || !object._ractive.setting );
		},
		wrap: function ( ractive, array, keypath ) {
			return new ArrayWrapper( ractive, array, keypath );
		}
	};

	var ArrayWrapper = function ArrayWrapper ( ractive, array ) {
		this.root = ractive;
		this.value = array;
		this.__model = null; // filled in later

		// if this array hasn't already been ractified, ractify it
		if ( !array._ractive ) {
			// define a non-enumerable _ractive property to store the wrappers
			defineProperty( array, '_ractive', {
				value: {
					wrappers: [],
					instances: [],
					setting: false
				},
				configurable: true
			});

			patch( array );
		}

		// store the ractive instance, so we can handle transitions later
		if ( !array._ractive.instances[ ractive._guid ] ) {
			array._ractive.instances[ ractive._guid ] = 0;
			array._ractive.instances.push( ractive );
		}

		array._ractive.instances[ ractive._guid ] += 1;
		array._ractive.wrappers.push( this );
	};

	ArrayWrapper.prototype.get = function get () {
		return this.value;
	};

	ArrayWrapper.prototype.reset = function reset ( value ) {
		return this.value === value;
	};

	ArrayWrapper.prototype.teardown = function teardown () {
		var array, storage, wrappers, instances, index;

		array = this.value;
		storage = array._ractive;
		wrappers = storage.wrappers;
		instances = storage.instances;

		// if teardown() was invoked because we're clearing the cache as a result of
		// a change that the array itself triggered, we can save ourselves the teardown
		// and immediate setup
		if ( storage.setting ) {
			return false; // so that we don't remove it from cached wrappers
		}

		index = wrappers.indexOf( this );
		if ( index === -1 ) {
			throw new Error( errorMessage$1 );
		}

		wrappers.splice( index, 1 );

		// if nothing else depends on this array, we can revert it to its
		// natural state
		if ( !wrappers.length ) {
			delete array._ractive;
			patch.unpatch( this.value );
		}

		else {
			// remove ractive instance if possible
			instances[ this.root._guid ] -= 1;
			if ( !instances[ this.root._guid ] ) {
				index = instances.indexOf( this.root );

				if ( index === -1 ) {
					throw new Error( errorMessage$1 );
				}

				instances.splice( index, 1 );
			}
		}
	};

	var magicAdaptor;

	try {
		Object.defineProperty({}, 'test', { get: function() {}, set: function() {} });

		magicAdaptor = {
			filter: function ( value ) {
				return value && typeof value === 'object';
			},
			wrap: function ( ractive, value, keypath ) {
				return new MagicWrapper( ractive, value, keypath );
			}
		};
	} catch ( err ) {
		magicAdaptor = false;
	}

	var magicAdaptor$1 = magicAdaptor;

	function createOrWrapDescriptor ( originalDescriptor, ractive, keypath, wrapper ) {
		if ( originalDescriptor.set && originalDescriptor.set.__magic ) {
			originalDescriptor.set.__magic.dependants.push({ ractive: ractive, keypath: keypath });
			return originalDescriptor;
		}

		var setting;

		var dependants = [{ ractive: ractive, keypath: keypath }];

		var descriptor = {
			get: function () {
				return 'value' in originalDescriptor ? originalDescriptor.value : originalDescriptor.get.call( this );
			},
			set: function (value) {
				if ( setting ) return;

				if ( 'value' in originalDescriptor ) {
					originalDescriptor.value = value;
				} else {
					originalDescriptor.set.call( this, value );
				}

				if ( wrapper.locked ) return;
				setting = true;
				dependants.forEach( function (ref) {
					var ractive = ref.ractive;
					var keypath = ref.keypath;

					ractive.set( keypath, value );
				});
				setting = false;
			},
			enumerable: true
		};

		descriptor.set.__magic = { dependants: dependants, originalDescriptor: originalDescriptor };

		return descriptor;
	}

	function revert ( descriptor, ractive, keypath ) {
		if ( !descriptor.set || !descriptor.set.__magic ) return true;

		var dependants = descriptor.set.__magic;
		var i = dependants.length;
		while ( i-- ) {
			var dependant = dependants[i];
			if ( dependant.ractive === ractive && dependant.keypath === keypath ) {
				dependants.splice( i, 1 );
				return false;
			}
		}
	}

	var MagicWrapper = function MagicWrapper ( ractive, value, keypath ) {
		var this$1 = this;

			this.ractive = ractive;
		this.value = value;
		this.keypath = keypath;

		this.originalDescriptors = {};

		// wrap all properties with getters
		Object.keys( value ).forEach( function ( key ) {
			var originalDescriptor = Object.getOwnPropertyDescriptor( this$1.value, key );
			this$1.originalDescriptors[ key ] = originalDescriptor;

			var childKeypath = keypath ? ("" + keypath + "." + (escapeKey( key ))) : escapeKey( key );

			var descriptor = createOrWrapDescriptor( originalDescriptor, ractive, childKeypath, this$1 );



			Object.defineProperty( this$1.value, key, descriptor );
		});
	};

	MagicWrapper.prototype.get = function get () {
		return this.value;
	};

	MagicWrapper.prototype.reset = function reset ( value ) {
		return this.value === value;
	};

	MagicWrapper.prototype.set = function set ( key, value ) {
		this.value[ key ] = value;
	};

	MagicWrapper.prototype.teardown = function teardown () {
		var this$1 = this;

			Object.keys( this.value ).forEach( function ( key ) {
			var descriptor = Object.getOwnPropertyDescriptor( this$1.value, key );
			if ( !descriptor.set || !descriptor.set.__magic ) return;

			revert( descriptor );

			if ( descriptor.set.__magic.dependants.length === 1 ) {
				Object.defineProperty( this$1.value, key, descriptor.set.__magic.originalDescriptor );
			}
		});
	};

	var MagicArrayWrapper = function MagicArrayWrapper ( ractive, array, keypath ) {
		this.value = array;

		this.magic = true;

		this.magicWrapper = magicAdaptor$1.wrap( ractive, array, keypath );
		this.arrayWrapper = arrayAdaptor.wrap( ractive, array, keypath );
		this.arrayWrapper.magic = this.magicWrapper;

		// ugh, this really is a terrible hack
		Object.defineProperty( this, '__model', {
			get: function () {
				return this.arrayWrapper.__model;
			},
			set: function ( model ) {
				this.arrayWrapper.__model = model;
			}
		});
	};

	MagicArrayWrapper.prototype.get = function get () {
		return this.value;
	};

	MagicArrayWrapper.prototype.teardown = function teardown () {
		this.arrayWrapper.teardown();
		this.magicWrapper.teardown();
	};

	MagicArrayWrapper.prototype.reset = function reset ( value ) {
		return this.arrayWrapper.reset( value ) && this.magicWrapper.reset( value );
	};

	var magicArrayAdaptor = {
		filter: function ( object, keypath, ractive ) {
			return magicAdaptor$1.filter( object, keypath, ractive ) && arrayAdaptor.filter( object );
		},

		wrap: function ( ractive, array, keypath ) {
			return new MagicArrayWrapper( ractive, array, keypath );
		}
	};

	// TODO this is probably a bit anal, maybe we should leave it out
	function prettify ( fnBody ) {
		var lines = fnBody
			.replace( /^\t+/gm, function ( tabs ) { return tabs.split( '\t' ).join( '  ' ); } )
			.split( '\n' );

		var minIndent = lines.length < 2 ? 0 :
			lines.slice( 1 ).reduce( function ( prev, line ) {
				return Math.min( prev, /^\s*/.exec( line )[0].length );
			}, Infinity );

		return lines.map( function ( line, i ) {
			return '    ' + ( i ? line.substring( minIndent ) : line );
		}).join( '\n' );
	}

	// Ditto. This function truncates the stack to only include app code
	function truncateStack ( stack ) {
		if ( !stack ) return '';

		var lines = stack.split( '\n' );
		var name = Computation.name + '.getValue';

		var truncated = [];

		var len = lines.length;
		for ( var i = 1; i < len; i += 1 ) {
			var line = lines[i];

			if ( ~line.indexOf( name ) ) {
				return truncated.join( '\n' );
			} else {
				truncated.push( line );
			}
		}
	}

	var Computation = (function (Model) {
		function Computation ( viewmodel, signature, key ) {
			Model.call( this, null, null );

			this.root = this.parent = viewmodel;
			this.signature = signature;

			this.key = key; // not actually used, but helps with debugging
			this.isExpression = key && key[0] === '@';

			this.isReadonly = !this.signature.setter;

			this.context = viewmodel.computationContext;

			this.dependencies = [];

			this.children = [];
			this.childByKey = {};

			this.deps = [];

			this.dirty = true;

			// TODO: is there a less hackish way to do this?
			this.shuffle = undefined;
		}

		Computation.prototype = Object.create( Model && Model.prototype );
		Computation.prototype.constructor = Computation;

		Computation.prototype.get = function get ( shouldCapture ) {
			if ( shouldCapture ) capture( this );

			if ( this.dirty ) {
				this.dirty = false;
				this.value = this.getValue();
				if ( this.wrapper ) this.newWrapperValue = this.value;
				this.adapt();
			}

			// if capturing, this value needs to be unwrapped because it's for external use
			return shouldCapture && this.wrapper ? this.wrapperValue : this.value;
		};

		Computation.prototype.getValue = function getValue () {
			startCapturing();
			var result;

			try {
				result = this.signature.getter.call( this.context );
			} catch ( err ) {
				warnIfDebug( ("Failed to compute " + (this.getKeypath()) + ": " + (err.message || err)) );

				// TODO this is all well and good in Chrome, but...
				// ...also, should encapsulate this stuff better, and only
				// show it if Ractive.DEBUG
				if ( hasConsole ) {
					if ( console.groupCollapsed ) console.groupCollapsed( '%cshow details', 'color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;' );
					var functionBody = prettify( this.signature.getterString );
					var stack = this.signature.getterUseStack ? '\n\n' + truncateStack( err.stack ) : '';
					console.error( ("" + (err.name) + ": " + (err.message) + "\n\n" + functionBody + "" + stack) );
					if ( console.groupCollapsed ) console.groupEnd();
				}
			}

			var dependencies = stopCapturing();
			this.setDependencies( dependencies );

			// if not the first computation and the value is not the same,
			// register the change for change events
			if ( 'value' in this && result !== this.value ) {
				this.registerChange( this.getKeypath(), result );
			}

			return result;
		};

		Computation.prototype.handleChange = function handleChange$1 () {
			this.dirty = true;

			this.links.forEach( marked );
			this.deps.forEach( handleChange );
			this.children.forEach( handleChange );
			this.clearUnresolveds(); // TODO same question as on Model - necessary for primitives?
		};

		Computation.prototype.joinKey = function joinKey ( key ) {
			if ( key === undefined || key === '' ) return this;

			if ( !this.childByKey.hasOwnProperty( key ) ) {
				var child = new ComputationChild( this, key );
				this.children.push( child );
				this.childByKey[ key ] = child;
			}

			return this.childByKey[ key ];
		};

		Computation.prototype.mark = function mark () {
			this.handleChange();
		};

		Computation.prototype.rebinding = function rebinding ( next, previous ) {
			// computations will grab all of their deps again automagically
			if ( next !== previous ) this.handleChange();
		};

		Computation.prototype.set = function set ( value ) {
			if ( !this.signature.setter ) {
				throw new Error( ("Cannot set read-only computed value '" + (this.key) + "'") );
			}

			this.signature.setter( value );
			this.mark();
		};

		Computation.prototype.setDependencies = function setDependencies ( dependencies ) {
			// unregister any soft dependencies we no longer have
			var this$1 = this;

			var i = this.dependencies.length;
			while ( i-- ) {
				var model = this$1.dependencies[i];
				if ( !~dependencies.indexOf( model ) ) model.unregister( this$1 );
			}

			// and add any new ones
			i = dependencies.length;
			while ( i-- ) {
				var model$1 = dependencies[i];
				if ( !~this$1.dependencies.indexOf( model$1 ) ) model$1.register( this$1 );
			}

			this.dependencies = dependencies;
		};

		Computation.prototype.teardown = function teardown () {
			var this$1 = this;

			var i = this.dependencies.length;
			while ( i-- ) {
				if ( this$1.dependencies[i] ) this$1.dependencies[i].unregister( this$1 );
			}
			if ( this.root.computations[this.key] === this ) delete this.root.computations[this.key];
			Model.prototype.teardown.call(this);
		};

		Computation.prototype.unregister = function unregister ( dependent ) {
			Model.prototype.unregister.call( this, dependent );
			// tear down expressions with no deps, because they will be replaced when needed
			if ( this.isExpression && this.deps.length === 0 ) this.teardown();
		};

		return Computation;
	}(Model));

	var RactiveModel = (function (Model) {
		function RactiveModel ( ractive ) {
			Model.call( this, null, '' );
			this.value = ractive;
			this.isRoot = true;
			this.root = this;
			this.adaptors = [];
			this.ractive = ractive;
			this.changes = {};
		}

		RactiveModel.prototype = Object.create( Model && Model.prototype );
		RactiveModel.prototype.constructor = RactiveModel;

		RactiveModel.prototype.getKeypath = function getKeypath() {
			return '@this';
		};

		return RactiveModel;
	}(Model));

	var hasProp$1 = Object.prototype.hasOwnProperty;

	var RootModel = (function (Model) {
		function RootModel ( options ) {
			Model.call( this, null, null );

			// TODO deprecate this
			this.changes = {};

			this.isRoot = true;
			this.root = this;
			this.ractive = options.ractive; // TODO sever this link

			this.value = options.data;
			this.adaptors = options.adapt;
			this.adapt();

			this.computationContext = options.ractive;
			this.computations = {};

			// TODO this is only for deprecation of using expression keypaths
			this.expressions = {};
		}

		RootModel.prototype = Object.create( Model && Model.prototype );
		RootModel.prototype.constructor = RootModel;

		RootModel.prototype.applyChanges = function applyChanges () {
			this._changeHash = {};
			this.flush();

			return this._changeHash;
		};

		RootModel.prototype.compute = function compute ( key, signature ) {
			var computation = new Computation( this, signature, key );
			this.computations[ escapeKey( key ) ] = computation;

			return computation;
		};

		RootModel.prototype.createLink = function createLink ( keypath, target, targetPath ) {
			var this$1 = this;

			var keys = splitKeypathI( keypath );

			var model = this;
			while ( keys.length ) {
				var key = keys.shift();
				model = this$1.childByKey[ key ] || this$1.joinKey( key );
			}

			return model.link( target, targetPath );
		};

		RootModel.prototype.get = function get ( shouldCapture, options ) {
			var this$1 = this;

			if ( shouldCapture ) capture( this );

			if ( !options || options.virtual !== false ) {
				var result = this.getVirtual();
				var keys = Object.keys( this.computations );
				var i = keys.length;
				while ( i-- ) {
					var computation = this$1.computations[ keys[i] ];
					// exclude template expressions
					if ( !computation.isExpression ) {
						result[ keys[i] ] = computation.get();
					}
				}

				return result;
			} else {
				return this.value;
			}
		};

		RootModel.prototype.getKeypath = function getKeypath () {
			return '';
		};

		RootModel.prototype.getRactiveModel = function getRactiveModel() {
			return this.ractiveModel || ( this.ractiveModel = new RactiveModel( this.ractive ) );
		};

		RootModel.prototype.getValueChildren = function getValueChildren () {
			var children = Model.prototype.getValueChildren.call( this, this.value );

			this.children.forEach( function ( child ) {
				if ( child._link ) {
					var idx = children.indexOf( child );
					if ( ~idx ) children.splice( idx, 1, child._link );
					else children.push( child._link );
				}
			});

			for ( var k in this.computations ) {
				children.push( this.computations[k] );
			}

			return children;
		};

		RootModel.prototype.handleChange = function handleChange$1 () {
			this.deps.forEach( handleChange );
		};

		RootModel.prototype.has = function has ( key ) {
			var value = this.value;
			var unescapedKey = unescapeKey( key );

			if ( hasProp$1.call( value, unescapedKey ) ) return true;

			// mappings/links and computations
			if ( key in this.computations || this.childByKey[unescapedKey] && this.childByKey[unescapedKey]._link ) return true;
			// TODO remove this after deprecation is done
			if ( key in this.expressions ) return true;

			// We climb up the constructor chain to find if one of them contains the unescapedKey
			var constructor = value.constructor;
			while ( constructor !== Function && constructor !== Array && constructor !== Object ) {
				if ( hasProp$1.call( constructor.prototype, unescapedKey ) ) return true;
				constructor = constructor.constructor;
			}

			return false;
		};

		RootModel.prototype.joinKey = function joinKey ( key, opts ) {
			if ( key === '@global' ) return GlobalModel$1;
			if ( key === '@this' ) return this.getRactiveModel();

			if ( this.expressions.hasOwnProperty( key ) ) {
				warnIfDebug( ("Accessing expression keypaths (" + (key.substr(1)) + ") from the instance is deprecated. You can used a getNodeInfo or event object to access keypaths with expression context.") );
				return this.expressions[ key ];
			}

			return this.computations.hasOwnProperty( key ) ? this.computations[ key ] :
			       Model.prototype.joinKey.call( this, key, opts );
		};

		RootModel.prototype.map = function map ( localKey, origin ) {
			var local = this.joinKey( localKey );
			local.link( origin );
		};

		RootModel.prototype.rebinding = function rebinding () {
		};

		RootModel.prototype.set = function set ( value ) {
			// TODO wrapping root node is a baaaad idea. We should prevent this
			var wrapper = this.wrapper;
			if ( wrapper ) {
				var shouldTeardown = !wrapper.reset || wrapper.reset( value ) === false;

				if ( shouldTeardown ) {
					wrapper.teardown();
					this.wrapper = null;
					this.value = value;
					this.adapt();
				}
			} else {
				this.value = value;
				this.adapt();
			}

			this.deps.forEach( handleChange );
			this.children.forEach( mark );
			this.clearUnresolveds(); // TODO do we need to do this with primitive values? if not, what about e.g. unresolved `length` property of null -> string?
		};

		RootModel.prototype.retrieve = function retrieve () {
			return this.wrapper ? this.wrapper.get() : this.value;
		};

		RootModel.prototype.update = function update () {
			// noop
		};

		return RootModel;
	}(Model));

	function getComputationSignature ( ractive, key, signature ) {
		var getter;
		var setter;

		// useful for debugging
		var getterString;
		var getterUseStack;
		var setterString;

		if ( typeof signature === 'function' ) {
			getter = bind( signature, ractive );
			getterString = signature.toString();
			getterUseStack = true;
		}

		if ( typeof signature === 'string' ) {
			getter = createFunctionFromString( signature, ractive );
			getterString = signature;
		}

		if ( typeof signature === 'object' ) {
			if ( typeof signature.get === 'string' ) {
				getter = createFunctionFromString( signature.get, ractive );
				getterString = signature.get;
			} else if ( typeof signature.get === 'function' ) {
				getter = bind( signature.get, ractive );
				getterString = signature.get.toString();
				getterUseStack = true;
			} else {
				fatal( '`%s` computation must have a `get()` method', key );
			}

			if ( typeof signature.set === 'function' ) {
				setter = bind( signature.set, ractive );
				setterString = signature.set.toString();
			}
		}

		return {
			getter: getter,
			setter: setter,
			getterString: getterString,
			setterString: setterString,
			getterUseStack: getterUseStack
		};
	}

	var constructHook = new Hook( 'construct' );

	var registryNames$1 = [
		'adaptors',
		'components',
		'decorators',
		'easing',
		'events',
		'interpolators',
		'partials',
		'transitions'
	];

	var uid = 0;

	function construct ( ractive, options ) {
		if ( Ractive.DEBUG ) welcome();

		initialiseProperties( ractive );

		// TODO remove this, eventually
		defineProperty( ractive, 'data', { get: deprecateRactiveData });

		// TODO don't allow `onconstruct` with `new Ractive()`, there's no need for it
		constructHook.fire( ractive, options );

		// Add registries
		registryNames$1.forEach( function ( name ) {
			ractive[ name ] = extendObj( create( ractive.constructor[ name ] || null ), options[ name ] );
		});

		// Create a viewmodel
		var viewmodel = new RootModel({
			adapt: getAdaptors( ractive, ractive.adapt, options ),
			data: dataConfigurator.init( ractive.constructor, ractive, options ),
			ractive: ractive
		});

		ractive.viewmodel = viewmodel;

		// Add computed properties
		var computed = extendObj( create( ractive.constructor.prototype.computed ), options.computed );

		for ( var key in computed ) {
			var signature = getComputationSignature( ractive, key, computed[ key ] );
			viewmodel.compute( key, signature );
		}
	}

	function combine$2 ( arrays ) {
		var res = [];
		var args = res.concat.apply( res, arrays );

		var i = args.length;
		while ( i-- ) {
			if ( !~res.indexOf( args[i] ) ) {
				res.unshift( args[i] );
			}
		}

		return res;
	}

	function getAdaptors ( ractive, protoAdapt, options ) {
		protoAdapt = protoAdapt.map( lookup );
		var adapt = ensureArray( options.adapt ).map( lookup );

		var builtins = [];
		var srcs = [ protoAdapt, adapt ];
		if ( ractive.parent && !ractive.isolated ) {
			srcs.push( ractive.parent.viewmodel.adaptors );
		}
		srcs.push( builtins );

		var magic = 'magic' in options ? options.magic : ractive.magic;
		var modifyArrays = 'modifyArrays' in options ? options.modifyArrays : ractive.modifyArrays;

		if ( magic ) {
			if ( !magicSupported ) {
				throw new Error( 'Getters and setters (magic mode) are not supported in this browser' );
			}

			if ( modifyArrays ) {
				builtins.push( magicArrayAdaptor );
			}

			builtins.push( magicAdaptor$1 );
		}

		if ( modifyArrays ) {
			builtins.push( arrayAdaptor );
		}

		return combine$2( srcs );


		function lookup ( adaptor ) {
			if ( typeof adaptor === 'string' ) {
				adaptor = findInViewHierarchy( 'adaptors', ractive, adaptor );

				if ( !adaptor ) {
					fatal( missingPlugin( adaptor, 'adaptor' ) );
				}
			}

			return adaptor;
		}
	}

	function initialiseProperties ( ractive ) {
		// Generate a unique identifier, for places where you'd use a weak map if it
		// existed
		ractive._guid = 'r-' + uid++;

		// events
		ractive._subs = create( null );

		// storage for item configuration from instantiation to reset,
		// like dynamic functions or original values
		ractive._config = {};

		// nodes registry
		ractive.nodes = {};

		// events
		ractive.event = null;
		ractive._eventQueue = [];

		// live queries
		ractive._liveQueries = [];
		ractive._liveComponentQueries = [];

		// observers
		ractive._observers = [];

		if(!ractive.component){
			ractive.root = ractive;
			ractive.parent = ractive.container = null; // TODO container still applicable?
		}

	}

	function deprecateRactiveData () {
		throw new Error( 'Using `ractive.data` is no longer supported - you must use the `ractive.get()` API instead' );
	}

	function getChildQueue ( queue, ractive ) {
		return queue[ ractive._guid ] || ( queue[ ractive._guid ] = [] );
	}

	function fire ( hookQueue, ractive ) {
		var childQueue = getChildQueue( hookQueue.queue, ractive );

		hookQueue.hook.fire( ractive );

		// queue is "live" because components can end up being
		// added while hooks fire on parents that modify data values.
		while ( childQueue.length ) {
			fire( hookQueue, childQueue.shift() );
		}

		delete hookQueue.queue[ ractive._guid ];
	}

	var HookQueue = function HookQueue ( event ) {
		this.hook = new Hook( event );
		this.inProcess = {};
		this.queue = {};
	};

	HookQueue.prototype.begin = function begin ( ractive ) {
		this.inProcess[ ractive._guid ] = true;
	};

	HookQueue.prototype.end = function end ( ractive ) {
		var parent = ractive.parent;

		// If this is *isn't* a child of a component that's in process,
		// it should call methods or fire at this point
		if ( !parent || !this.inProcess[ parent._guid ] ) {
			fire( this, ractive );
		}
		// elsewise, handoff to parent to fire when ready
		else {
			getChildQueue( this.queue, parent ).push( ractive );
		}

		delete this.inProcess[ ractive._guid ];
	};

	var configHook = new Hook( 'config' );
	var initHook = new HookQueue( 'init' );

	function initialise ( ractive, userOptions, options ) {
		Object.keys( ractive.viewmodel.computations ).forEach( function ( key ) {
			var computation = ractive.viewmodel.computations[ key ];

			if ( ractive.viewmodel.value.hasOwnProperty( key ) ) {
				computation.set( ractive.viewmodel.value[ key ] );
			}
		});

		// init config from Parent and options
		config.init( ractive.constructor, ractive, userOptions );

		configHook.fire( ractive );
		initHook.begin( ractive );

		var fragment;

		// Render virtual DOM
		if ( ractive.template ) {
			var cssIds;

			if ( options.cssIds || ractive.cssId ) {
				cssIds = options.cssIds ? options.cssIds.slice() : [];

				if ( ractive.cssId ) {
					cssIds.push( ractive.cssId );
				}
			}

			ractive.fragment = fragment = new Fragment({
				owner: ractive,
				template: ractive.template,
				cssIds: cssIds
			}).bind( ractive.viewmodel );
		}

		initHook.end( ractive );

		if ( fragment ) {
			// render automatically ( if `el` is specified )
			var el = getElement( ractive.el );
			if ( el ) {
				var promise = ractive.render( el, ractive.append );

				if ( Ractive.DEBUG_PROMISES ) {
					promise['catch']( function ( err ) {
						warnOnceIfDebug( 'Promise debugging is enabled, to help solve errors that happen asynchronously. Some browsers will log unhandled promise rejections, in which case you can safely disable promise debugging:\n  Ractive.DEBUG_PROMISES = false;' );
						warnIfDebug( 'An error happened during rendering', { ractive: ractive });
						logIfDebug( err );

						throw err;
					});
				}
			}
		}
	}

	var DOMEvent = function DOMEvent ( name, owner ) {
		if ( name.indexOf( '*' ) !== -1 ) {
			fatal( ("Only component proxy-events may contain \"*\" wildcards, <" + (owner.name) + " on-" + name + "=\"...\"/> is not valid") );
		}

		this.name = name;
		this.owner = owner;
		this.node = null;
		this.handler = null;
	};

	DOMEvent.prototype.listen = function listen ( directive ) {
		var node = this.node = this.owner.node;
		var name = this.name;

		if ( !( ("on" + name) in node ) ) {
			warnOnce( missingPlugin( name, 'events' ) );
			}

			node.addEventListener( name, this.handler = function( event ) {
			directive.fire({
					node: node,
				original: event
				});
			}, false );
	};

	DOMEvent.prototype.unlisten = function unlisten () {
		if ( this.handler ) this.node.removeEventListener( this.name, this.handler, false );
	};

	var CustomEvent = function CustomEvent ( eventPlugin, owner ) {
		this.eventPlugin = eventPlugin;
		this.owner = owner;
		this.handler = null;
	};

	CustomEvent.prototype.listen = function listen ( directive ) {
		var node = this.owner.node;

		this.handler = this.eventPlugin( node, function ( event ) {
			if ( event === void 0 ) event = {};

				event.node = event.node || node;
			directive.fire( event );
		});
	};

	CustomEvent.prototype.unlisten = function unlisten () {
		this.handler.teardown();
	};

	var RactiveEvent = function RactiveEvent ( ractive, name ) {
		this.ractive = ractive;
		this.name = name;
		this.handler = null;
	};

	RactiveEvent.prototype.listen = function listen ( directive ) {
		var ractive = this.ractive;

		this.handler = ractive.on( this.name, function () {
			var event;

			// semi-weak test, but what else? tag the event obj ._isEvent ?
			if ( arguments.length && arguments[0] && arguments[0].node ) {
				event = Array.prototype.shift.call( arguments );
				event.component = ractive;
			}

			var args = Array.prototype.slice.call( arguments );
			directive.fire( event, args );

			// cancel bubbling
			return false;
		});
	};

	RactiveEvent.prototype.unlisten = function unlisten () {
		this.handler.cancel();
	};

	var specialPattern = /^(event|arguments)(\..+)?$/;
	var dollarArgsPattern = /^\$(\d+)(\..+)?$/;

	var EventDirective = function EventDirective ( options ) {
		var this$1 = this;

			this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
		this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment );
		this.template = options.template;
		this.parentFragment = options.parentFragment;
		this.ractive = options.parentFragment.ractive;

		this.events = [];

		if ( this.element.type === COMPONENT ) {
			this.template.n.split( '-' ).forEach( function ( n ) {
				this$1.events.push( new RactiveEvent( this$1.element.instance, n ) );
			});
		} else {
			this.template.n.split( '-' ).forEach( function ( n ) {
				var fn = findInViewHierarchy( 'events', this$1.ractive, n );
				// we need to pass in "this" in order to get
				// access to node when it is created.
				this$1.events.push(fn ? new CustomEvent( fn, this$1.element ) : new DOMEvent( n, this$1.element ));
			});
		}

		this.context = null;

		// method calls
		this.resolvers = null;
		this.models = null;

		// handler directive
		this.action = null;
		this.args = null;
	};

	EventDirective.prototype.bind = function bind () {
		var this$1 = this;

			this.context = this.parentFragment.findContext();

		var template = this.template.f;

		if ( template.x ) {
			this.fn = getFunction( template.x.s, template.x.r.length );
			this.resolvers = [];
			this.models = template.x.r.map( function ( ref, i ) {
				var specialMatch = specialPattern.exec( ref );
				if ( specialMatch ) {
					// on-click="foo(event.node)"
					return {
						special: specialMatch[1],
						keys: specialMatch[2] ? splitKeypathI( specialMatch[2].substr(1) ) : []
					};
				}

				var dollarMatch = dollarArgsPattern.exec( ref );
				if ( dollarMatch ) {
					// on-click="foo($1)"
					return {
						special: 'arguments',
						keys: [ dollarMatch[1] - 1 ].concat( dollarMatch[2] ? splitKeypathI( dollarMatch[2].substr( 1 ) ) : [] )
					};
				}

				var resolver;

				var model = resolveReference( this$1.parentFragment, ref );
				if ( !model ) {
					resolver = this$1.parentFragment.resolve( ref, function ( model ) {
						this$1.models[i] = model;
						removeFromArray( this$1.resolvers, resolver );
						model.register( this$1 );
					});

					this$1.resolvers.push( resolver );
				} else model.register( this$1 );

				return model;
			});
		}

		else {
			// TODO deprecate this style of directive
			this.action = typeof template === 'string' ? // on-click='foo'
				template :
				typeof template.n === 'string' ? // on-click='{{dynamic}}'
					template.n :
					new Fragment({
						owner: this,
						template: template.n
					});

			this.args = template.a ? // static arguments
				( typeof template.a === 'string' ? [ template.a ] : template.a ) :
				template.d ? // dynamic arguments
					new Fragment({
						owner: this,
						template: template.d
					}) :
					[]; // no arguments
		}

		if ( this.action && typeof this.action !== 'string' ) this.action.bind();
		if ( this.args && template.d ) this.args.bind();
	};

	EventDirective.prototype.bubble = function bubble () {
		if ( !this.dirty ) {
			this.dirty = true;
			this.owner.bubble();
		}
	};

	EventDirective.prototype.destroyed = function destroyed () {
		this.events.forEach( function ( e ) { return e.unlisten(); } );
	};

	EventDirective.prototype.fire = function fire ( event, passedArgs ) {

		// augment event object
		if ( passedArgs === void 0 ) passedArgs = [];

			if ( event && !event.hasOwnProperty( '_element' ) ) {
			   addHelpers( event, this.owner );
		}

		if ( this.fn ) {
			var values = [];

			if ( event ) passedArgs.unshift( event );

			if ( this.models ) {
				this.models.forEach( function ( model ) {
					if ( !model ) return values.push( undefined );

					if ( model.special ) {
						var obj = model.special === 'event' ? event : passedArgs;
						var keys = model.keys.slice();

						while ( keys.length ) obj = obj[ keys.shift() ];
						return values.push( obj );
					}

					if ( model.wrapper ) {
						return values.push( model.wrapperValue );
					}

					values.push( model.get() );
				});
			}

			// make event available as `this.event`
			var ractive = this.ractive;
			var oldEvent = ractive.event;

			ractive.event = event;
			var result = this.fn.apply( ractive, values ).pop();

			// Auto prevent and stop if return is explicitly false
			if ( result === false ) {
				var original = event ? event.original : undefined;
				if ( original ) {
					original.preventDefault && original.preventDefault();
					original.stopPropagation && original.stopPropagation();
				} else {
					warnOnceIfDebug( ("handler '" + (this.template.n) + "' returned false, but there is no event available to cancel") );
				}
			}

			ractive.event = oldEvent;
		}

		else {
			var action = this.action.toString();
			var args = this.template.f.d ? this.args.getArgsList() : this.args;

			if ( passedArgs.length ) args = args.concat( passedArgs );

			if ( event ) event.name = action;

			fireEvent( this.ractive, action, {
				event: event,
				args: args
			});
		}
	};

	EventDirective.prototype.handleChange = function handleChange () {};

	EventDirective.prototype.rebinding = function rebinding ( next, previous ) {
		var this$1 = this;

			if ( !this.models ) return;
		var idx = this.models.indexOf( previous );

		if ( ~idx ) {
			this.models.splice( idx, 1, next );
			previous.unregister( this );
			if ( next ) next.addShuffleTask( function () { return next.register( this$1 ); } );
		}
	};

	EventDirective.prototype.render = function render () {
		// render events after everything else, so they fire after bindings
		var this$1 = this;

			runloop.scheduleTask( function () { return this$1.events.forEach( function ( e ) { return e.listen( this$1 ); }, true ); } );
	};

	EventDirective.prototype.toString = function toString() { return ''; };

	EventDirective.prototype.unbind = function unbind$1 () {
		var this$1 = this;

			var template = this.template.f;

		if ( template.m ) {
			if ( this.resolvers ) this.resolvers.forEach( unbind );
			this.resolvers = [];

			if ( this.models ) this.models.forEach( function ( m ) {
				if ( m.unregister ) m.unregister( this$1 );
			});
			this.models = null;
		}

		else {
			// TODO this is brittle and non-explicit, fix it
			if ( this.action && this.action.unbind ) this.action.unbind();
			if ( this.args && this.args.unbind ) this.args.unbind();
		}
	};

	EventDirective.prototype.unrender = function unrender () {
		this.events.forEach( function ( e ) { return e.unlisten(); } );
	};

	EventDirective.prototype.update = function update () {
		if ( this.method || !this.dirty ) return; // nothing to do

		this.dirty = false;

		// ugh legacy
		if ( this.action && this.action.update ) this.action.update();
		if ( this.args && this.args.update ) this.args.update();
	};

	// TODO it's unfortunate that this has to run every time a
	// component is rendered... is there a better way?
	function updateLiveQueries ( component ) {
		// Does this need to be added to any live queries?
		var instance = component.ractive;

		do {
			var liveQueries = instance._liveComponentQueries;

			var i = liveQueries.length;
			while ( i-- ) {
				var name = liveQueries[i];
				var query = liveQueries[ ("_" + name) ];

				if ( query.test( component ) ) {
					query.add( component.instance );
					// keep register of applicable selectors, for when we teardown
					component.liveQueries.push( query );
				}
			}
		} while ( instance = instance.parent );
	}

	function removeFromLiveComponentQueries ( component ) {
		var instance = component.ractive;

		while ( instance ) {
			var query = instance._liveComponentQueries[ ("_" + (component.name)) ];
			if ( query ) query.remove( component );

			instance = instance.parent;
		}
	}

	function makeDirty ( query ) {
		query.makeDirty();
	}

	var teardownHook = new Hook( 'teardown' );

	var Component = (function (Item) {
		function Component ( options, ComponentConstructor ) {
			var this$1 = this;

			Item.call( this, options );
			this.type = COMPONENT; // override ELEMENT from super

			var instance = create( ComponentConstructor.prototype );

			this.instance = instance;
			this.name = options.template.e;
			this.parentFragment = options.parentFragment;

			this.liveQueries = [];

			if ( instance.el ) {
				warnIfDebug( ("The <" + (this.name) + "> component has a default 'el' property; it has been disregarded") );
			}

			var partials = options.template.p || {};
			if ( !( 'content' in partials ) ) partials.content = options.template.f || [];
			this._partials = partials; // TEMP

			this.yielders = {};

			// find container
			var fragment = options.parentFragment;
			var container;
			while ( fragment ) {
				if ( fragment.owner.type === YIELDER ) {
					container = fragment.owner.container;
					break;
				}

				fragment = fragment.parent;
			}

			// add component-instance-specific properties
			instance.parent = this.parentFragment.ractive;
			instance.container = container || null;
			instance.root = instance.parent.root;
			instance.component = this;

			construct( this.instance, { partials: partials });

			// for hackability, this could be an open option
			// for any ractive instance, but for now, just
			// for components and just for ractive...
			instance._inlinePartials = partials;

			this.attributeByName = {};

			this.attributes = [];
			var leftovers = [];
			( this.template.m || [] ).forEach( function ( template ) {
				switch ( template.t ) {
					case ATTRIBUTE:
					case EVENT:
					case TRANSITION:
						this$1.attributes.push( createItem({
							owner: this$1,
							parentFragment: this$1.parentFragment,
							template: template
						}) );
						break;

					case BINDING_FLAG:
					case DECORATOR:
						break;

					default:
						leftovers.push( template );
						break;
				}
			});

			this.attributes.push( new ConditionalAttribute({
				owner: this,
				parentFragment: this.parentFragment,
				template: leftovers
			}) );

			this.eventHandlers = [];
			if ( this.template.v ) this.setupEvents();
		}

		Component.prototype = Object.create( Item && Item.prototype );
		Component.prototype.constructor = Component;

		Component.prototype.bind = function bind$1$$ () {
			this.attributes.forEach( bind$1 );

			initialise( this.instance, {
				partials: this._partials
			}, {
				cssIds: this.parentFragment.cssIds
			});

			this.eventHandlers.forEach( bind$1 );

			this.bound = true;
		};

		Component.prototype.bubble = function bubble () {
			if ( !this.dirty ) {
				this.dirty = true;
				this.parentFragment.bubble();
			}
		};

		Component.prototype.checkYielders = function checkYielders () {
			var this$1 = this;

			Object.keys( this.yielders ).forEach( function ( name ) {
				if ( this$1.yielders[ name ].length > 1 ) {
					runloop.end();
					throw new Error( ("A component template can only have one {{yield" + (name ? ' ' + name : '') + "}} declaration at a time") );
				}
			});
		};

		Component.prototype.destroyed = function destroyed () {
			if ( this.instance.fragment ) this.instance.fragment.destroyed();
		};

		Component.prototype.detach = function detach () {
			return this.instance.fragment.detach();
		};

		Component.prototype.find = function find ( selector ) {
			return this.instance.fragment.find( selector );
		};

		Component.prototype.findAll = function findAll ( selector, query ) {
			this.instance.fragment.findAll( selector, query );
		};

		Component.prototype.findComponent = function findComponent ( name ) {
			if ( !name || this.name === name ) return this.instance;

			if ( this.instance.fragment ) {
				return this.instance.fragment.findComponent( name );
			}
		};

		Component.prototype.findAllComponents = function findAllComponents ( name, query ) {
			if ( query.test( this ) ) {
				query.add( this.instance );

				if ( query.live ) {
					this.liveQueries.push( query );
				}
			}

			this.instance.fragment.findAllComponents( name, query );
		};

		Component.prototype.firstNode = function firstNode ( skipParent ) {
			return this.instance.fragment.firstNode( skipParent );
		};

		Component.prototype.render = function render$1$$ ( target, occupants ) {
			render$1( this.instance, target, null, occupants );

			this.checkYielders();
			this.attributes.forEach( render );
			this.eventHandlers.forEach( render );
			updateLiveQueries( this );

			this.rendered = true;
		};

		Component.prototype.setupEvents = function setupEvents () {
			var this$1 = this;

			var handlers = this.eventHandlers;

			Object.keys( this.template.v ).forEach( function ( key ) {
				var eventNames = key.split( '-' );
				var template = this$1.template.v[ key ];

				eventNames.forEach( function ( eventName ) {
					var event = new RactiveEvent( this$1.instance, eventName );
					handlers.push( new EventDirective( this$1, event, template ) );
				});
			});
		};

		Component.prototype.shuffled = function shuffled () {
			this.liveQueries.forEach( makeDirty );
			Item.prototype.shuffled.call(this);
		};

		Component.prototype.toString = function toString () {
			return this.instance.toHTML();
		};

		Component.prototype.unbind = function unbind$1 () {
			this.bound = false;

			this.attributes.forEach( unbind );

			var instance = this.instance;
			instance.viewmodel.teardown();
			instance.fragment.unbind();
			instance._observers.forEach( cancel );

			removeFromLiveComponentQueries( this );

			if ( instance.fragment.rendered && instance.el.__ractive_instances__ ) {
				removeFromArray( instance.el.__ractive_instances__, instance );
			}

			teardownHook.fire( instance );
		};

		Component.prototype.unrender = function unrender$1 ( shouldDestroy ) {
			var this$1 = this;

			this.rendered = false;

			this.shouldDestroy = shouldDestroy;
			this.instance.unrender();
			this.attributes.forEach( unrender );
			this.eventHandlers.forEach( unrender );
			this.liveQueries.forEach( function ( query ) { return query.remove( this$1.instance ); } );
		};

		Component.prototype.update = function update$1 () {
			this.dirty = false;
			this.instance.fragment.update();
			this.checkYielders();
			this.attributes.forEach( update );
			this.eventHandlers.forEach( update );
		};

		return Component;
	}(Item));

	var missingDecorator = {
		update: noop,
		teardown: noop
	};

	var Decorator = function Decorator ( options ) {
		this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
		this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment );
		this.parentFragment = this.owner.parentFragment;
		this.ractive = this.owner.ractive;
		var template = this.template = options.template;

		this.dynamicName = typeof template.f.n === 'object';
		this.dynamicArgs = !!template.f.d;

		if ( this.dynamicName ) {
			this.nameFragment = new Fragment({
				owner: this,
				template: template.f.n
			});
		} else {
			this.name = template.f.n || template.f;
		}

		if ( this.dynamicArgs ) {
			this.argsFragment = new Fragment({
				owner: this,
				template: template.f.d
			});
		} else {
			if ( template.f.a && template.f.a.s ) {
				this.args = [];
			} else {
				this.args = template.f.a || [];
			}
		}

		this.node = null;
		this.intermediary = null;

		this.element.decorators.push( this );
	};

	Decorator.prototype.bind = function bind () {
		var this$1 = this;

			if ( this.dynamicName ) {
			this.nameFragment.bind();
			this.name = this.nameFragment.toString();
		}

		if ( this.dynamicArgs ) this.argsFragment.bind();

		// TODO: dry this up once deprecation is done
		if ( this.template.f.a && this.template.f.a.s ) {
			this.resolvers = [];
			this.models = this.template.f.a.r.map( function ( ref, i ) {
				var resolver;
				var model = resolveReference( this$1.parentFragment, ref );
				if ( !model ) {
					resolver = this$1.parentFragment.resolve( ref, function ( model ) {
						this$1.models[i] = model;
						removeFromArray( this$1.resolvers, resolver );
						model.register( this$1 );
					});

					this$1.resolvers.push( resolver );
				} else model.register( this$1 );

				return model;
			});
			this.argsFn = getFunction( this.template.f.a.s, this.template.f.a.r.length );
		}
	};

	Decorator.prototype.bubble = function bubble () {
		if ( !this.dirty ) {
			this.dirty = true;
			this.owner.bubble();
		}
	};

	Decorator.prototype.destroyed = function destroyed () {
		if ( this.intermediary ) this.intermediary.teardown();
		this.shouldDestroy = true;
	};

	Decorator.prototype.handleChange = function handleChange () { this.bubble(); };

	Decorator.prototype.rebinding = function rebinding ( next, previous, safe ) {
		var idx = this.models.indexOf( previous );
		if ( !~idx ) return;

		next = rebindMatch( this.template.f.a.r[ idx ], next, previous );
		if ( next === previous ) return;

		previous.unregister( this );
		this.models.splice( idx, 1, next );
		if ( next ) next.addShuffleRegister( this, 'mark' );

		if ( !safe ) this.bubble();
	};

	Decorator.prototype.render = function render () {
		var this$1 = this;

			runloop.scheduleTask( function () {
			var fn = findInViewHierarchy( 'decorators', this$1.ractive, this$1.name );

			if ( !fn ) {
				warnOnce( missingPlugin( this$1.name, 'decorator' ) );
				this$1.intermediary = missingDecorator;
				return;
			}

			this$1.node = this$1.element.node;

			var args;
			if ( this$1.argsFn ) {
				args = this$1.models.map( function ( model ) {
					if ( !model ) return undefined;

					return model.get();
				});
				args = this$1.argsFn.apply( this$1.ractive, args );
			} else {
				args = this$1.dynamicArgs ? this$1.argsFragment.getArgsList() : this$1.args;
			}

			this$1.intermediary = fn.apply( this$1.ractive, [ this$1.node ].concat( args ) );

			if ( !this$1.intermediary || !this$1.intermediary.teardown ) {
				throw new Error( ("The '" + (this$1.name) + "' decorator must return an object with a teardown method") );
			}

			// watch out for decorators that cause their host element to be unrendered
			if ( this$1.shouldDestroy ) this$1.destroyed();
		}, true );
		this.rendered = true;
	};

	Decorator.prototype.toString = function toString () { return ''; };

	Decorator.prototype.unbind = function unbind$1 () {
		var this$1 = this;

			if ( this.dynamicName ) this.nameFragment.unbind();
		if ( this.dynamicArgs ) this.argsFragment.unbind();
		if ( this.resolvers ) this.resolvers.forEach( unbind );
		if ( this.models ) this.models.forEach( function ( m ) {
			if ( m ) m.unregister( this$1 );
		});
	};

	Decorator.prototype.unrender = function unrender ( shouldDestroy ) {
		if ( ( !shouldDestroy || this.element.rendered ) && this.intermediary ) this.intermediary.teardown();
		this.rendered = false;
	};

	Decorator.prototype.update = function update () {
		if ( !this.dirty ) return;

		this.dirty = false;

		var nameChanged = false;

		if ( this.dynamicName && this.nameFragment.dirty ) {
			var name = this.nameFragment.toString();
			nameChanged = name !== this.name;
			this.name = name;
		}

		if ( this.intermediary ) {
			if ( nameChanged || !this.intermediary.update ) {
				this.unrender();
				this.render();
			}
			else {
				if ( this.dynamicArgs ) {
					if ( this.argsFragment.dirty ) {
						var args = this.argsFragment.getArgsList();
						this.intermediary.update.apply( this.ractive, args );
					}
				}
				else if ( this.argsFn ) {
					var args$1 = this.models.map( function ( model ) {
						if ( !model ) return undefined;

						return model.get();
					});
					this.intermediary.update.apply( this.ractive, this.argsFn.apply( this.ractive, args$1 ) );
				}
				else {
					this.intermediary.update.apply( this.ractive, this.args );
				}
			}
		}

		// need to run these for unrender/render cases
		// so can't just be in conditional if above

		if ( this.dynamicName && this.nameFragment.dirty ) {
			this.nameFragment.update();
		}

		if ( this.dynamicArgs && this.argsFragment.dirty ) {
			this.argsFragment.update();
		}
	};

	var Doctype = (function (Item) {
		function Doctype () {
			Item.apply(this, arguments);
		}

		Doctype.prototype = Object.create( Item && Item.prototype );
		Doctype.prototype.constructor = Doctype;

		Doctype.prototype.bind = function bind () {
			// noop
		};

		Doctype.prototype.render = function render () {
			// noop
		};

		Doctype.prototype.teardown = function teardown () {
			// noop
		};

		Doctype.prototype.toString = function toString () {
			return '<!DOCTYPE' + this.template.a + '>';
		};

		Doctype.prototype.unbind = function unbind () {
			// noop
		};

		Doctype.prototype.unrender = function unrender () {
			// noop
		};

		Doctype.prototype.update = function update () {
			// noop
		};

		return Doctype;
	}(Item));

	function updateLiveQueries$1 ( element ) {
		// Does this need to be added to any live queries?
		var node = element.node;
		var instance = element.ractive;

		do {
			var liveQueries = instance._liveQueries;

			var i = liveQueries.length;
			while ( i-- ) {
				var selector = liveQueries[i];
				var query = liveQueries[ ("_" + selector) ];

				if ( query.test( node ) ) {
					query.add( node );
					// keep register of applicable selectors, for when we teardown
					element.liveQueries.push( query );
				}
			}
		} while ( instance = instance.parent );
	}

	function warnAboutAmbiguity ( description, ractive ) {
		warnOnceIfDebug( ("The " + description + " being used for two-way binding is ambiguous, and may cause unexpected results. Consider initialising your data to eliminate the ambiguity"), { ractive: ractive });
	}

	var Binding = function Binding ( element, name ) {
		if ( name === void 0 ) name = 'value';

			this.element = element;
		this.ractive = element.ractive;
		this.attribute = element.attributeByName[ name ];

		var interpolator = this.attribute.interpolator;
		interpolator.twowayBinding = this;

		var model = interpolator.model;

		// not bound?
		if ( !model ) {
			// try to force resolution
			interpolator.resolver.forceResolution();
			model = interpolator.model;

			warnAboutAmbiguity( ("'" + (interpolator.template.r) + "' reference"), this.ractive );
			}

			else if ( model.isUnresolved ) {
				// reference expressions (e.g. foo[bar])
				model.forceResolution();
				warnAboutAmbiguity( 'expression', this.ractive );
		}

		// TODO include index/key/keypath refs as read-only
		else if ( model.isReadonly ) {
			var keypath = model.getKeypath().replace( /^@/, '' );
			warnOnceIfDebug( ("Cannot use two-way binding on <" + (element.name) + "> element: " + keypath + " is read-only. To suppress this warning use <" + (element.name) + " twoway='false'...>"), { ractive: this.ractive });
			return false;
		}

		this.attribute.isTwoway = true;
		this.model = model;

		// initialise value, if it's undefined
		var value = model.get();
		this.wasUndefined = value === undefined;

		if ( value === undefined && this.getInitialValue ) {
			value = this.getInitialValue();
			model.set( value );
		}
		this.lastVal( true, value );

		var parentForm = findElement( this.element, false, 'form' );
		if ( parentForm ) {
			this.resetValue = value;
			parentForm.formBindings.push( this );
		}
	};

	Binding.prototype.bind = function bind () {
		this.model.registerTwowayBinding( this );
	};

	Binding.prototype.handleChange = function handleChange () {
		var this$1 = this;

			var value = this.getValue();
		if ( this.lastVal() === value ) return;

		runloop.start( this.root );
		this.attribute.locked = true;
		this.model.set( value );
		this.lastVal( true, value );

		// if the value changes before observers fire, unlock to be updatable cause something weird and potentially freezy is up
		if ( this.model.get() !== value ) this.attribute.locked = false;
		else runloop.scheduleTask( function () { return this$1.attribute.locked = false; } );

		runloop.end();
	};

	Binding.prototype.lastVal = function lastVal ( setting, value ) {
		if ( setting ) this.lastValue = value;
		else return this.lastValue;
	};

	Binding.prototype.rebinding = function rebinding ( next, previous ) {
		var this$1 = this;

			if ( this.model && this.model === previous ) previous.unregisterTwowayBinding( this );
		if ( next ) {
			this.model = next;
			runloop.scheduleTask( function () { return next.registerTwowayBinding( this$1 ); } );
		}
	};

	Binding.prototype.render = function render () {
		this.node = this.element.node;
		this.node._ractive.binding = this;
		this.rendered = true; // TODO is this used anywhere?
	};

		Binding.prototype.setFromNode = function setFromNode ( node ) {
			this.model.set( node.value );
	};

	Binding.prototype.unbind = function unbind () {
		this.model.unregisterTwowayBinding( this );
	};

	Binding.prototype.unrender = function unrender () {
			// noop?
		};

	// This is the handler for DOM events that would lead to a change in the model
	// (i.e. change, sometimes, input, and occasionally click and keyup)
	function handleDomEvent () {
		this._ractive.binding.handleChange();
	}

	var CheckboxBinding = (function (Binding) {
		function CheckboxBinding ( element ) {
			Binding.call( this, element, 'checked' );
		}

		CheckboxBinding.prototype = Object.create( Binding && Binding.prototype );
		CheckboxBinding.prototype.constructor = CheckboxBinding;

		CheckboxBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);

			this.node.addEventListener( 'change', handleDomEvent, false );

			if ( this.node.attachEvent ) {
				this.node.addEventListener( 'click', handleDomEvent, false );
			}
		};

		CheckboxBinding.prototype.unrender = function unrender () {
			this.node.removeEventListener( 'change', handleDomEvent, false );
			this.node.removeEventListener( 'click', handleDomEvent, false );
		};

		CheckboxBinding.prototype.getInitialValue = function getInitialValue () {
			return !!this.element.getAttribute( 'checked' );
		};

		CheckboxBinding.prototype.getValue = function getValue () {
			return this.node.checked;
		};

		CheckboxBinding.prototype.setFromNode = function setFromNode ( node ) {
			this.model.set( node.checked );
		};

		return CheckboxBinding;
	}(Binding));

	function getBindingGroup ( group, model, getValue ) {
		var hash = "" + group + "-bindingGroup";
		return model[hash] || ( model[ hash ] = new BindingGroup( hash, model, getValue ) );
	}

	var BindingGroup = function BindingGroup ( hash, model, getValue ) {
		var this$1 = this;

			this.model = model;
		this.hash = hash;
		this.getValue = function () {
			this$1.value = getValue.call(this$1);
			return this$1.value;
		};

		this.bindings = [];
	};

	BindingGroup.prototype.add = function add ( binding ) {
		this.bindings.push( binding );
	};

	BindingGroup.prototype.bind = function bind () {
		this.value = this.model.get();
		this.model.registerTwowayBinding( this );
		this.bound = true;
	};

	BindingGroup.prototype.remove = function remove ( binding ) {
		removeFromArray( this.bindings, binding );
		if ( !this.bindings.length ) {
			this.unbind();
		}
	};

	BindingGroup.prototype.unbind = function unbind () {
		this.model.unregisterTwowayBinding( this );
		this.bound = false;
		delete this.model[this.hash];
	};

	var push$2 = [].push;

	function getValue() {
		var all = this.bindings.filter(function ( b ) { return b.node && b.node.checked; }).map(function ( b ) { return b.element.getAttribute( 'value' ); });
		var res = [];
		all.forEach(function ( v ) { if ( !arrayContains( res, v ) ) res.push( v ); });
		return res;
	}

	var CheckboxNameBinding = (function (Binding) {
		function CheckboxNameBinding ( element ) {
			Binding.call( this, element, 'name' );

			this.checkboxName = true; // so that ractive.updateModel() knows what to do with this

			// Each input has a reference to an array containing it and its
			// group, as two-way binding depends on being able to ascertain
			// the status of all inputs within the group
			this.group = getBindingGroup( 'checkboxes', this.model, getValue );
			this.group.add( this );

			if ( this.noInitialValue ) {
				this.group.noInitialValue = true;
			}

			// If no initial value was set, and this input is checked, we
			// update the model
			if ( this.group.noInitialValue && this.element.getAttribute( 'checked' ) ) {
				var existingValue = this.model.get();
				var bindingValue = this.element.getAttribute( 'value' );

				if ( !arrayContains( existingValue, bindingValue ) ) {
					push$2.call( existingValue, bindingValue ); // to avoid triggering runloop with array adaptor
				}
			}
		}

		CheckboxNameBinding.prototype = Object.create( Binding && Binding.prototype );
		CheckboxNameBinding.prototype.constructor = CheckboxNameBinding;

		CheckboxNameBinding.prototype.bind = function bind () {
			if ( !this.group.bound ) {
				this.group.bind();
			}
		};

		CheckboxNameBinding.prototype.changed = function changed () {
			var wasChecked = !!this.isChecked;
			this.isChecked = this.node.checked;
			return this.isChecked === wasChecked;
		};

		CheckboxNameBinding.prototype.getInitialValue = function getInitialValue () {
			// This only gets called once per group (of inputs that
			// share a name), because it only gets called if there
			// isn't an initial value. By the same token, we can make
			// a note of that fact that there was no initial value,
			// and populate it using any `checked` attributes that
			// exist (which users should avoid, but which we should
			// support anyway to avoid breaking expectations)
			this.noInitialValue = true; // TODO are noInitialValue and wasUndefined the same thing?
			return [];
		};

		CheckboxNameBinding.prototype.getValue = function getValue$1 () {
			return this.group.value;
		};

		CheckboxNameBinding.prototype.handleChange = function handleChange () {
			this.isChecked = this.element.node.checked;
			this.group.value = this.model.get();
			var value = this.element.getAttribute( 'value' );
			if ( this.isChecked && !arrayContains( this.group.value, value ) ) {
				this.group.value.push( value );
			} else if ( !this.isChecked && arrayContains( this.group.value, value ) ) {
				removeFromArray( this.group.value, value );
			}
			// make sure super knows there's a change
			this.lastValue = null;
			Binding.prototype.handleChange.call(this);
		};

		CheckboxNameBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);

			var node = this.node;

			var existingValue = this.model.get();
			var bindingValue = this.element.getAttribute( 'value' );

			if ( isArray( existingValue ) ) {
				this.isChecked = arrayContains( existingValue, bindingValue );
			} else {
				this.isChecked = existingValue == bindingValue;
			}

			node.name = '{{' + this.model.getKeypath() + '}}';
			node.checked = this.isChecked;

			node.addEventListener( 'change', handleDomEvent, false );

			// in case of IE emergency, bind to click event as well
			if ( node.attachEvent ) {
				node.addEventListener( 'click', handleDomEvent, false );
			}
		};

		CheckboxNameBinding.prototype.setFromNode = function setFromNode ( node ) {
			this.group.bindings.forEach( function ( binding ) { return binding.wasUndefined = true; } );

			if ( node.checked ) {
				var valueSoFar = this.group.getValue();
				valueSoFar.push( this.element.getAttribute( 'value' ) );

				this.group.model.set( valueSoFar );
			}
		};

		CheckboxNameBinding.prototype.unbind = function unbind () {
			this.group.remove( this );
		};

		CheckboxNameBinding.prototype.unrender = function unrender () {
			var node = this.element.node;

			node.removeEventListener( 'change', handleDomEvent, false );
			node.removeEventListener( 'click', handleDomEvent, false );
		};

		return CheckboxNameBinding;
	}(Binding));

	var ContentEditableBinding = (function (Binding) {
		function ContentEditableBinding () {
			Binding.apply(this, arguments);
		}

		ContentEditableBinding.prototype = Object.create( Binding && Binding.prototype );
		ContentEditableBinding.prototype.constructor = ContentEditableBinding;

		ContentEditableBinding.prototype.getInitialValue = function getInitialValue () {
			return this.element.fragment ? this.element.fragment.toString() : '';
		};

		ContentEditableBinding.prototype.getValue = function getValue () {
			return this.element.node.innerHTML;
		};

		ContentEditableBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);

			var node = this.node;

			node.addEventListener( 'change', handleDomEvent, false );
			node.addEventListener( 'blur', handleDomEvent, false );

			if ( !this.ractive.lazy ) {
				node.addEventListener( 'input', handleDomEvent, false );

				if ( node.attachEvent ) {
					node.addEventListener( 'keyup', handleDomEvent, false );
				}
			}
		};

		ContentEditableBinding.prototype.setFromNode = function setFromNode ( node ) {
			this.model.set( node.innerHTML );
		};

		ContentEditableBinding.prototype.unrender = function unrender () {
			var node = this.node;

			node.removeEventListener( 'blur', handleDomEvent, false );
			node.removeEventListener( 'change', handleDomEvent, false );
			node.removeEventListener( 'input', handleDomEvent, false );
			node.removeEventListener( 'keyup', handleDomEvent, false );
		};

		return ContentEditableBinding;
	}(Binding));

	function handleBlur () {
		handleDomEvent.call( this );

		var value = this._ractive.binding.model.get();
		this.value = value == undefined ? '' : value;
	}

	function handleDelay ( delay ) {
		var timeout;

		return function () {
			var this$1 = this;

			if ( timeout ) clearTimeout( timeout );

			timeout = setTimeout( function () {
				var binding = this$1._ractive.binding;
				if ( binding.rendered ) handleDomEvent.call( this$1 );
				timeout = null;
			}, delay );
		};
	}

	var GenericBinding = (function (Binding) {
		function GenericBinding () {
			Binding.apply(this, arguments);
		}

		GenericBinding.prototype = Object.create( Binding && Binding.prototype );
		GenericBinding.prototype.constructor = GenericBinding;

		GenericBinding.prototype.getInitialValue = function getInitialValue () {
			return '';
		};

		GenericBinding.prototype.getValue = function getValue () {
			return this.node.value;
		};

		GenericBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);

			// any lazy setting for this element overrides the root
			// if the value is a number, it's a timeout
			var lazy = this.ractive.lazy;
			var timeout = false;

			if ( 'lazy' in this.element ) {
				lazy = this.element.lazy;
			}

			if ( isNumeric( lazy ) ) {
				timeout = +lazy;
				lazy = false;
			}

			this.handler = timeout ? handleDelay( timeout ) : handleDomEvent;

			var node = this.node;

			node.addEventListener( 'change', handleDomEvent, false );

			if ( !lazy ) {
				node.addEventListener( 'input', this.handler, false );

				if ( node.attachEvent ) {
					node.addEventListener( 'keyup', this.handler, false );
				}
			}

			node.addEventListener( 'blur', handleBlur, false );
		};

		GenericBinding.prototype.unrender = function unrender () {
			var node = this.element.node;
			this.rendered = false;

			node.removeEventListener( 'change', handleDomEvent, false );
			node.removeEventListener( 'input', this.handler, false );
			node.removeEventListener( 'keyup', this.handler, false );
			node.removeEventListener( 'blur', handleBlur, false );
		};

		return GenericBinding;
	}(Binding));

	var FileBinding = (function (GenericBinding) {
		function FileBinding () {
			GenericBinding.apply(this, arguments);
		}

		FileBinding.prototype = Object.create( GenericBinding && GenericBinding.prototype );
		FileBinding.prototype.constructor = FileBinding;

		FileBinding.prototype.getInitialValue = function getInitialValue () {
			return undefined;
		};

		FileBinding.prototype.getValue = function getValue () {
			return this.node.files;
		};

		FileBinding.prototype.render = function render () {
			this.element.lazy = false;
			GenericBinding.prototype.render.call(this);
		};

		FileBinding.prototype.setFromNode = function setFromNode( node ) {
			this.model.set( node.files );
		};

		return FileBinding;
	}(GenericBinding));

	function getSelectedOptions ( select ) {
	    return select.selectedOptions
			? toArray( select.selectedOptions )
			: select.options
				? toArray( select.options ).filter( function ( option ) { return option.selected; } )
				: [];
	}

	var MultipleSelectBinding = (function (Binding) {
		function MultipleSelectBinding () {
			Binding.apply(this, arguments);
		}

		MultipleSelectBinding.prototype = Object.create( Binding && Binding.prototype );
		MultipleSelectBinding.prototype.constructor = MultipleSelectBinding;

		MultipleSelectBinding.prototype.forceUpdate = function forceUpdate () {
			var this$1 = this;

			var value = this.getValue();

			if ( value !== undefined ) {
				this.attribute.locked = true;
				runloop.scheduleTask( function () { return this$1.attribute.locked = false; } );
				this.model.set( value );
			}
		};

		MultipleSelectBinding.prototype.getInitialValue = function getInitialValue () {
			return this.element.options
				.filter( function ( option ) { return option.getAttribute( 'selected' ); } )
				.map( function ( option ) { return option.getAttribute( 'value' ); } );
		};

		MultipleSelectBinding.prototype.getValue = function getValue () {
			var options = this.element.node.options;
			var len = options.length;

			var selectedValues = [];

			for ( var i = 0; i < len; i += 1 ) {
				var option = options[i];

				if ( option.selected ) {
					var optionValue = option._ractive ? option._ractive.value : option.value;
					selectedValues.push( optionValue );
				}
			}

			return selectedValues;
		};

		MultipleSelectBinding.prototype.handleChange = function handleChange () {
			var attribute = this.attribute;
			var previousValue = attribute.getValue();

			var value = this.getValue();

			if ( previousValue === undefined || !arrayContentsMatch( value, previousValue ) ) {
				Binding.prototype.handleChange.call(this);
			}

			return this;
		};

		MultipleSelectBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);

			this.node.addEventListener( 'change', handleDomEvent, false );

			if ( this.model.get() === undefined ) {
				// get value from DOM, if possible
				this.handleChange();
			}
		};

		MultipleSelectBinding.prototype.setFromNode = function setFromNode ( node ) {
			var selectedOptions = getSelectedOptions( node );
			var i = selectedOptions.length;
			var result = new Array( i );

			while ( i-- ) {
				var option = selectedOptions[i];
				result[i] = option._ractive ? option._ractive.value : option.value;
			}

			this.model.set( result );
		};

		MultipleSelectBinding.prototype.setValue = function setValue () {
			throw new Error( 'TODO not implemented yet' );
		};

		MultipleSelectBinding.prototype.unrender = function unrender () {
			this.node.removeEventListener( 'change', handleDomEvent, false );
		};

		MultipleSelectBinding.prototype.updateModel = function updateModel () {
			if ( this.attribute.value === undefined || !this.attribute.value.length ) {
				this.keypath.set( this.initialValue );
			}
		};

		return MultipleSelectBinding;
	}(Binding));

	var NumericBinding = (function (GenericBinding) {
		function NumericBinding () {
			GenericBinding.apply(this, arguments);
		}

		NumericBinding.prototype = Object.create( GenericBinding && GenericBinding.prototype );
		NumericBinding.prototype.constructor = NumericBinding;

		NumericBinding.prototype.getInitialValue = function getInitialValue () {
			return undefined;
		};

		NumericBinding.prototype.getValue = function getValue () {
			var value = parseFloat( this.node.value );
			return isNaN( value ) ? undefined : value;
		};

		NumericBinding.prototype.setFromNode = function setFromNode( node ) {
			var value = parseFloat( node.value );
			if ( !isNaN( value ) ) this.model.set( value );
		};

		return NumericBinding;
	}(GenericBinding));

	var siblings = {};

	function getSiblings ( hash ) {
		return siblings[ hash ] || ( siblings[ hash ] = [] );
	}

	var RadioBinding = (function (Binding) {
		function RadioBinding ( element ) {
			Binding.call( this, element, 'checked' );

			this.siblings = getSiblings( this.ractive._guid + this.element.getAttribute( 'name' ) );
			this.siblings.push( this );
		}

		RadioBinding.prototype = Object.create( Binding && Binding.prototype );
		RadioBinding.prototype.constructor = RadioBinding;

		RadioBinding.prototype.getValue = function getValue () {
			return this.node.checked;
		};

		RadioBinding.prototype.handleChange = function handleChange () {
			runloop.start( this.root );

			this.siblings.forEach( function ( binding ) {
				binding.model.set( binding.getValue() );
			});

			runloop.end();
		};

		RadioBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);

			this.node.addEventListener( 'change', handleDomEvent, false );

			if ( this.node.attachEvent ) {
				this.node.addEventListener( 'click', handleDomEvent, false );
			}
		};

		RadioBinding.prototype.setFromNode = function setFromNode ( node ) {
			this.model.set( node.checked );
		};

		RadioBinding.prototype.unbind = function unbind () {
			removeFromArray( this.siblings, this );
		};

		RadioBinding.prototype.unrender = function unrender () {
			this.node.removeEventListener( 'change', handleDomEvent, false );
			this.node.removeEventListener( 'click', handleDomEvent, false );
		};

		return RadioBinding;
	}(Binding));

	function getValue$1() {
		var checked = this.bindings.filter( function ( b ) { return b.node.checked; } );
		if ( checked.length > 0 ) {
			return checked[0].element.getAttribute( 'value' );
		}
	}

	var RadioNameBinding = (function (Binding) {
		function RadioNameBinding ( element ) {
			Binding.call( this, element, 'name' );

			this.group = getBindingGroup( 'radioname', this.model, getValue$1 );
			this.group.add( this );

			if ( element.checked ) {
				this.group.value = this.getValue();
			}
		}

		RadioNameBinding.prototype = Object.create( Binding && Binding.prototype );
		RadioNameBinding.prototype.constructor = RadioNameBinding;

		RadioNameBinding.prototype.bind = function bind () {
			var this$1 = this;

			if ( !this.group.bound ) {
				this.group.bind();
			}

			// update name keypath when necessary
			this.nameAttributeBinding = {
				handleChange: function () { return this$1.node.name = "{{" + (this$1.model.getKeypath()) + "}}"; }
			};

			this.model.getKeypathModel().register( this.nameAttributeBinding );
		};

		RadioNameBinding.prototype.getInitialValue = function getInitialValue () {
			if ( this.element.getAttribute( 'checked' ) ) {
				return this.element.getAttribute( 'value' );
			}
		};

		RadioNameBinding.prototype.getValue = function getValue$1 () {
			return this.element.getAttribute( 'value' );
		};

		RadioNameBinding.prototype.handleChange = function handleChange () {
			// If this <input> is the one that's checked, then the value of its
			// `name` model gets set to its value
			if ( this.node.checked ) {
				this.group.value = this.getValue();
				Binding.prototype.handleChange.call(this);
			}
		};

		RadioNameBinding.prototype.lastVal = function lastVal ( setting, value ) {
			if ( !this.group ) return;
			if ( setting ) this.group.lastValue = value;
			else return this.group.lastValue;
		};

		RadioNameBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);

			var node = this.node;

			node.name = "{{" + (this.model.getKeypath()) + "}}";
			node.checked = this.model.get() == this.element.getAttribute( 'value' );

			node.addEventListener( 'change', handleDomEvent, false );

			if ( node.attachEvent ) {
				node.addEventListener( 'click', handleDomEvent, false );
			}
		};

		RadioNameBinding.prototype.setFromNode = function setFromNode ( node ) {
			if ( node.checked ) {
				this.group.model.set( this.element.getAttribute( 'value' ) );
			}
		};

		RadioNameBinding.prototype.unbind = function unbind () {
			this.group.remove( this );

			this.model.getKeypathModel().unregister( this.nameAttributeBinding );
		};

		RadioNameBinding.prototype.unrender = function unrender () {
			var node = this.node;

			node.removeEventListener( 'change', handleDomEvent, false );
			node.removeEventListener( 'click', handleDomEvent, false );
		};

		return RadioNameBinding;
	}(Binding));

	var SingleSelectBinding = (function (Binding) {
		function SingleSelectBinding () {
			Binding.apply(this, arguments);
		}

		SingleSelectBinding.prototype = Object.create( Binding && Binding.prototype );
		SingleSelectBinding.prototype.constructor = SingleSelectBinding;

		SingleSelectBinding.prototype.forceUpdate = function forceUpdate () {
			var this$1 = this;

			var value = this.getValue();

			if ( value !== undefined ) {
				this.attribute.locked = true;
				runloop.scheduleTask( function () { return this$1.attribute.locked = false; } );
				this.model.set( value );
			}
		};

		SingleSelectBinding.prototype.getInitialValue = function getInitialValue () {
			if ( this.element.getAttribute( 'value' ) !== undefined ) {
				return;
			}

			var options = this.element.options;
			var len = options.length;

			if ( !len ) return;

			var value;
			var optionWasSelected;
			var i = len;

			// take the final selected option...
			while ( i-- ) {
				var option = options[i];

				if ( option.getAttribute( 'selected' ) ) {
					if ( !option.getAttribute( 'disabled' ) ) {
						value = option.getAttribute( 'value' );
					}

					optionWasSelected = true;
					break;
				}
			}

			// or the first non-disabled option, if none are selected
			if ( !optionWasSelected ) {
				while ( ++i < len ) {
					if ( !options[i].getAttribute( 'disabled' ) ) {
						value = options[i].getAttribute( 'value' );
						break;
					}
				}
			}

			// This is an optimisation (aka hack) that allows us to forgo some
			// other more expensive work
			// TODO does it still work? seems at odds with new architecture
			if ( value !== undefined ) {
				this.element.attributeByName.value.value = value;
			}

			return value;
		};

		SingleSelectBinding.prototype.getValue = function getValue () {
			var options = this.node.options;
			var len = options.length;

			var i;
			for ( i = 0; i < len; i += 1 ) {
				var option = options[i];

				if ( options[i].selected && !options[i].disabled ) {
					return option._ractive ? option._ractive.value : option.value;
				}
			}
		};

		SingleSelectBinding.prototype.render = function render () {
			Binding.prototype.render.call(this);
			this.node.addEventListener( 'change', handleDomEvent, false );
		};

		SingleSelectBinding.prototype.setFromNode = function setFromNode ( node ) {
			var option = getSelectedOptions( node )[0];
			this.model.set( option._ractive ? option._ractive.value : option.value );
		};

		// TODO this method is an anomaly... is it necessary?
		SingleSelectBinding.prototype.setValue = function setValue ( value ) {
			this.model.set( value );
		};

		SingleSelectBinding.prototype.unrender = function unrender () {
			this.node.removeEventListener( 'change', handleDomEvent, false );
		};

		return SingleSelectBinding;
	}(Binding));

	function isBindable ( attribute ) {
		return attribute &&
			   attribute.template.f &&
		       attribute.template.f.length === 1 &&
		       attribute.template.f[0].t === INTERPOLATOR &&
		       !attribute.template.f[0].s;
	}

	function selectBinding ( element ) {
		var attributes = element.attributeByName;

		// contenteditable - bind if the contenteditable attribute is true
		// or is bindable and may thus become true...
		if ( element.getAttribute( 'contenteditable' ) || isBindable( attributes.contenteditable ) ) {
			// ...and this element also has a value attribute to bind
			return isBindable( attributes.value ) ? ContentEditableBinding : null;
		}

		// <input>
		if ( element.name === 'input' ) {
			var type = element.getAttribute( 'type' );

			if ( type === 'radio' || type === 'checkbox' ) {
				var bindName = isBindable( attributes.name );
				var bindChecked = isBindable( attributes.checked );

				// for radios we can either bind the name attribute, or the checked attribute - not both
				if ( bindName && bindChecked ) {
					if ( type === 'radio' ) {
						warnIfDebug( 'A radio input can have two-way binding on its name attribute, or its checked attribute - not both', { ractive: element.root });
					} else {
						// A checkbox with bindings for both name and checked - see https://github.com/ractivejs/ractive/issues/1749
						return CheckboxBinding;
					}
				}

				if ( bindName ) {
					return type === 'radio' ? RadioNameBinding : CheckboxNameBinding;
				}

				if ( bindChecked ) {
					return type === 'radio' ? RadioBinding : CheckboxBinding;
				}
			}

			if ( type === 'file' && isBindable( attributes.value ) ) {
				return FileBinding;
			}

			if ( isBindable( attributes.value ) ) {
				return ( type === 'number' || type === 'range' ) ? NumericBinding : GenericBinding;
			}

			return null;
		}

		// <select>
		if ( element.name === 'select' && isBindable( attributes.value ) ) {
			return element.getAttribute( 'multiple' ) ? MultipleSelectBinding : SingleSelectBinding;
		}

		// <textarea>
		if ( element.name === 'textarea' && isBindable( attributes.value ) ) {
			return GenericBinding;
		}
	}

	function makeDirty$1 ( query ) {
		query.makeDirty();
	}

	var endsWithSemi = /;\s*$/;

	var Element = (function (Item) {
		function Element ( options ) {
			var this$1 = this;

			Item.call( this, options );

			this.liveQueries = []; // TODO rare case. can we handle differently?

			this.name = options.template.e.toLowerCase();
			this.isVoid = voidElementNames.test( this.name );

			// find parent element
			this.parent = findElement( this.parentFragment, false );

			if ( this.parent && this.parent.name === 'option' ) {
				throw new Error( ("An <option> element cannot contain other elements (encountered <" + (this.name) + ">)") );
			}

			this.decorators = [];

			// create attributes
			this.attributeByName = {};

			this.attributes = [];
			var leftovers = [];
			( this.template.m || [] ).forEach( function ( template ) {
				switch ( template.t ) {
					case ATTRIBUTE:
					case BINDING_FLAG:
					case DECORATOR:
					case EVENT:
					case TRANSITION:
						this$1.attributes.push( createItem({
							owner: this$1,
							parentFragment: this$1.parentFragment,
							template: template
						}) );
						break;

					default:
						leftovers.push( template );
						break;
				}
			});

			if ( leftovers.length ) {
				this.attributes.push( new ConditionalAttribute({
					owner: this,
					parentFragment: this.parentFragment,
					template: leftovers
				}) );
			}

			var i = this.attributes.length;
			while ( i-- ) {
				var attr = this$1.attributes[ i ];
				if ( attr.name === 'type' ) this$1.attributes.unshift( this$1.attributes.splice( i, 1 )[ 0 ] );
				else if ( attr.name === 'max' ) this$1.attributes.unshift( this$1.attributes.splice( i, 1 )[ 0 ] );
				else if ( attr.name === 'min' ) this$1.attributes.unshift( this$1.attributes.splice( i, 1 )[ 0 ] );
				else if ( attr.name === 'class' ) this$1.attributes.unshift( this$1.attributes.splice( i, 1 )[ 0 ] );
				else if ( attr.name === 'value' ) {
					this$1.attributes.push( this$1.attributes.splice( i, 1 )[ 0 ] );
				}
			}

			// create children
			if ( options.template.f && !options.deferContent ) {
				this.fragment = new Fragment({
					template: options.template.f,
					owner: this,
					cssIds: null
				});
			}

			this.binding = null; // filled in later
		}

		Element.prototype = Object.create( Item && Item.prototype );
		Element.prototype.constructor = Element;

		Element.prototype.bind = function bind$1$$ () {
			this.attributes.binding = true;
			this.attributes.forEach( bind$1 );
			this.attributes.binding = false;

			if ( this.fragment ) this.fragment.bind();

			// create two-way binding if necessary
			if ( !this.binding ) this.recreateTwowayBinding();
		};

		Element.prototype.createTwowayBinding = function createTwowayBinding () {
			var shouldBind = 'twoway' in this ? this.twoway : this.ractive.twoway;

			if ( !shouldBind ) return null;

			var Binding = selectBinding( this );

			if ( !Binding ) return null;

			var binding = new Binding( this );

			return binding && binding.model ?
				binding :
				null;
		};

		Element.prototype.destroyed = function destroyed () {
			this.attributes.forEach( function ( a ) { return a.destroyed(); } );
			if ( this.fragment ) this.fragment.destroyed();
		};

		Element.prototype.detach = function detach () {
			// if this element is no longer rendered, the transitions are complete and the attributes can be torn down
			if ( !this.rendered ) this.destroyed();

			return detachNode( this.node );
		};

		Element.prototype.find = function find ( selector ) {
			if ( this.node && matches( this.node, selector ) ) return this.node;
			if ( this.fragment ) {
				return this.fragment.find( selector );
			}
		};

		Element.prototype.findAll = function findAll ( selector, query ) {
			// Add this node to the query, if applicable, and register the
			// query on this element
			var matches = query.test( this.node );
			if ( matches ) {
				query.add( this.node );
				if ( query.live ) this.liveQueries.push( query );
			}

			if ( this.fragment ) {
				this.fragment.findAll( selector, query );
			}
		};

		Element.prototype.findComponent = function findComponent ( name ) {
			if ( this.fragment ) {
				return this.fragment.findComponent( name );
			}
		};

		Element.prototype.findAllComponents = function findAllComponents ( name, query ) {
			if ( this.fragment ) {
				this.fragment.findAllComponents( name, query );
			}
		};

		Element.prototype.findNextNode = function findNextNode () {
			return null;
		};

		Element.prototype.firstNode = function firstNode () {
			return this.node;
		};

		Element.prototype.getAttribute = function getAttribute ( name ) {
			var attribute = this.attributeByName[ name ];
			return attribute ? attribute.getValue() : undefined;
		};

		Element.prototype.recreateTwowayBinding = function recreateTwowayBinding () {
			if ( this.binding ) {
				this.binding.unbind();
				this.binding.unrender();
			}

			if ( this.binding = this.createTwowayBinding() ) {
				this.binding.bind();
				if ( this.rendered ) this.binding.render();
			}
		};

		Element.prototype.render = function render$1 ( target, occupants ) {
			// TODO determine correct namespace
			var this$1 = this;

			this.namespace = getNamespace( this );

			var node;
			var existing = false;

			if ( occupants ) {
				var n;
				while ( ( n = occupants.shift() ) ) {
					if ( n.nodeName.toUpperCase() === this$1.template.e.toUpperCase() && n.namespaceURI === this$1.namespace ) {
						this$1.node = node = n;
						existing = true;
						break;
					} else {
						detachNode( n );
					}
				}
			}

			if ( !node ) {
				node = createElement( this.template.e, this.namespace, this.getAttribute( 'is' ) );
				this.node = node;
			}

			defineProperty( node, '_ractive', {
				value: {
					proxy: this
				}
			});

			// Is this a top-level node of a component? If so, we may need to add
			// a data-ractive-css attribute, for CSS encapsulation
			if ( this.parentFragment.cssIds ) {
				node.setAttribute( 'data-ractive-css', this.parentFragment.cssIds.map( function ( x ) { return ("{" + x + "}"); } ).join( ' ' ) );
			}

			if ( existing && this.foundNode ) this.foundNode( node );

			if ( this.fragment ) {
				var children = existing ? toArray( node.childNodes ) : undefined;

				this.fragment.render( node, children );

				// clean up leftover children
				if ( children ) {
					children.forEach( detachNode );
				}
			}

			if ( existing ) {
				// store initial values for two-way binding
				if ( this.binding && this.binding.wasUndefined ) this.binding.setFromNode( node );
				// remove unused attributes
				var i = node.attributes.length;
				while ( i-- ) {
					var name = node.attributes[i].name;
					if ( !( name in this$1.attributeByName ) ) node.removeAttribute( name );
				}
			}

			this.attributes.forEach( render );

			if ( this.binding ) this.binding.render();

			updateLiveQueries$1( this );

			if ( this._introTransition && this.ractive.transitionsEnabled ) {
				this._introTransition.isIntro = true;
				runloop.registerTransition( this._introTransition );
			}

			if ( !existing ) {
				target.appendChild( node );
			}

			this.rendered = true;
		};

		Element.prototype.shuffled = function shuffled () {
			this.liveQueries.forEach( makeDirty$1 );
			Item.prototype.shuffled.call(this);
		};

		Element.prototype.toString = function toString () {
			var tagName = this.template.e;

			var attrs = this.attributes.map( stringifyAttribute ).join( '' );

			// Special case - selected options
			if ( this.name === 'option' && this.isSelected() ) {
				attrs += ' selected';
			}

			// Special case - two-way radio name bindings
			if ( this.name === 'input' && inputIsCheckedRadio( this ) ) {
				attrs += ' checked';
			}

			// Special case style and class attributes and directives
			var style, cls;
			this.attributes.forEach( function ( attr ) {
				if ( attr.name === 'class' ) {
					cls = ( cls || '' ) + ( cls ? ' ' : '' ) + safeAttributeString( attr.getString() );
				} else if ( attr.name === 'style' ) {
					style = ( style || '' ) + ( style ? ' ' : '' ) + safeAttributeString( attr.getString() );
					if ( style && !endsWithSemi.test( style ) ) style += ';';
				} else if ( attr.style ) {
					style = ( style || '' ) + ( style ? ' ' : '' ) +  "" + (attr.style) + ": " + (safeAttributeString( attr.getString() )) + ";";
				} else if ( attr.inlineClass && attr.getValue() ) {
					cls = ( cls || '' ) + ( cls ? ' ' : '' ) + attr.inlineClass;
				}
			});
			// put classes first, then inline style
			if ( style !== undefined ) attrs = ' style' + ( style ? ("=\"" + style + "\"") : '' ) + attrs;
			if ( cls !== undefined ) attrs = ' class' + (cls ? ("=\"" + cls + "\"") : '') + attrs;

			var str = "<" + tagName + "" + attrs + ">";

			if ( this.isVoid ) return str;

			// Special case - textarea
			if ( this.name === 'textarea' && this.getAttribute( 'value' ) !== undefined ) {
				str += escapeHtml( this.getAttribute( 'value' ) );
			}

			// Special case - contenteditable
			else if ( this.getAttribute( 'contenteditable' ) !== undefined ) {
				str += ( this.getAttribute( 'value' ) || '' );
			}

			if ( this.fragment ) {
				str += this.fragment.toString( !/^(?:script|style)$/i.test( this.template.e ) ); // escape text unless script/style
			}

			str += "</" + tagName + ">";
			return str;
		};

		Element.prototype.unbind = function unbind$1 () {
			this.attributes.unbinding = true;
			this.attributes.forEach( unbind );
			this.attributes.unbinding = false;

			if ( this.binding ) this.binding.unbind();
			if ( this.fragment ) this.fragment.unbind();
		};

		Element.prototype.unrender = function unrender ( shouldDestroy ) {
			if ( !this.rendered ) return;
			this.rendered = false;

			// unrendering before intro completed? complete it now
			// TODO should be an API for aborting transitions
			var transition = this._introTransition;
			if ( transition && transition.complete ) transition.complete();

			// Detach as soon as we can
			if ( this.name === 'option' ) {
				// <option> elements detach immediately, so that
				// their parent <select> element syncs correctly, and
				// since option elements can't have transitions anyway
				this.detach();
			} else if ( shouldDestroy ) {
				runloop.detachWhenReady( this );
			}

			if ( this.fragment ) this.fragment.unrender();

			if ( this.binding ) this.binding.unrender();

			// outro transition
			if ( this._outroTransition && this.ractive.transitionsEnabled ) {
				this._outroTransition.isIntro = false;
				runloop.registerTransition( this._outroTransition );
			}

			removeFromLiveQueries( this );
			// TODO forms are a special case
		};

		Element.prototype.update = function update$1 () {
			if ( this.dirty ) {
				this.dirty = false;

				this.attributes.forEach( update );

				if ( this.fragment ) this.fragment.update();
			}
		};

		return Element;
	}(Item));

	function inputIsCheckedRadio ( element ) {
		var attributes = element.attributeByName;

		var typeAttribute  = attributes.type;
		var valueAttribute = attributes.value;
		var nameAttribute  = attributes.name;

		if ( !typeAttribute || ( typeAttribute.value !== 'radio' ) || !valueAttribute || !nameAttribute.interpolator ) {
			return;
		}

		if ( valueAttribute.getValue() === nameAttribute.interpolator.model.get() ) {
			return true;
		}
	}

	function stringifyAttribute ( attribute ) {
		var str = attribute.toString();
		return str ? ' ' + str : '';
	}

	function removeFromLiveQueries ( element ) {
		var i = element.liveQueries.length;
		while ( i-- ) {
			var query = element.liveQueries[i];
			query.remove( element.node );
		}
	}

	function getNamespace ( element ) {
		// Use specified namespace...
		var xmlns = element.getAttribute( 'xmlns' );
		if ( xmlns ) return xmlns;

		// ...or SVG namespace, if this is an <svg> element
		if ( element.name === 'svg' ) return svg$1;

		var parent = element.parent;

		if ( parent ) {
			// ...or HTML, if the parent is a <foreignObject>
			if ( parent.name === 'foreignobject' ) return html;

			// ...or inherit from the parent node
			return parent.node.namespaceURI;
		}

		return element.ractive.el.namespaceURI;
	}

	var Form = (function (Element) {
		function Form ( options ) {
			Element.call( this, options );
			this.formBindings = [];
		}

		Form.prototype = Object.create( Element && Element.prototype );
		Form.prototype.constructor = Form;

		Form.prototype.render = function render ( target, occupants ) {
			Element.prototype.render.call( this, target, occupants );
			this.node.addEventListener( 'reset', handleReset, false );
		};

		Form.prototype.unrender = function unrender ( shouldDestroy ) {
			this.node.removeEventListener( 'reset', handleReset, false );
			Element.prototype.unrender.call( this, shouldDestroy );
		};

		return Form;
	}(Element));

	function handleReset () {
		var element = this._ractive.proxy;

		runloop.start();
		element.formBindings.forEach( updateModel$1 );
		runloop.end();
	}

	function updateModel$1 ( binding ) {
		binding.model.set( binding.resetValue );
	}

	var Mustache = (function (Item) {
		function Mustache ( options ) {
			Item.call( this, options );

			this.parentFragment = options.parentFragment;
			this.template = options.template;
			this.index = options.index;
			if ( options.owner ) this.parent = options.owner;

			this.isStatic = !!options.template.s;

			this.model = null;
			this.dirty = false;
		}

		Mustache.prototype = Object.create( Item && Item.prototype );
		Mustache.prototype.constructor = Mustache;

		Mustache.prototype.bind = function bind () {
			// try to find a model for this view
			var this$1 = this;

			var model = resolve$2( this.parentFragment, this.template );
			var value = model ? model.get() : undefined;

			if ( this.isStatic ) {
				this.model = { get: function () { return value; } };
				return;
			}

			if ( model ) {
				model.register( this );
				this.model = model;
			} else {
				this.resolver = this.parentFragment.resolve( this.template.r, function ( model ) {
					this$1.model = model;
					model.register( this$1 );

					this$1.handleChange();
					this$1.resolver = null;
				});
			}
		};

		Mustache.prototype.handleChange = function handleChange () {
			this.bubble();
		};

		Mustache.prototype.rebinding = function rebinding ( next, previous, safe ) {
			next = rebindMatch( this.template, next, previous );
			if ( this['static'] ) return false;
			if ( next === this.model ) return false;

			if ( this.model ) {
				this.model.unregister( this );
			}
			if ( next ) next.addShuffleRegister( this, 'mark' );
			this.model = next;
			if ( !safe ) this.handleChange();
			return true;
		};

		Mustache.prototype.unbind = function unbind () {
			if ( !this.isStatic ) {
				this.model && this.model.unregister( this );
				this.model = undefined;
				this.resolver && this.resolver.unbind();
			}
		};

		return Mustache;
	}(Item));

	var Interpolator = (function (Mustache) {
		function Interpolator () {
			Mustache.apply(this, arguments);
		}

		Interpolator.prototype = Object.create( Mustache && Mustache.prototype );
		Interpolator.prototype.constructor = Interpolator;

		Interpolator.prototype.bubble = function bubble () {
			if ( this.owner ) this.owner.bubble();
			Mustache.prototype.bubble.call(this);
		};

		Interpolator.prototype.detach = function detach () {
			return detachNode( this.node );
		};

		Interpolator.prototype.firstNode = function firstNode () {
			return this.node;
		};

		Interpolator.prototype.getString = function getString () {
			return this.model ? safeToStringValue( this.model.get() ) : '';
		};

		Interpolator.prototype.render = function render ( target, occupants ) {
			if ( inAttributes() ) return;
			var value = this.getString();

			this.rendered = true;

			if ( occupants ) {
				var n = occupants[0];
				if ( n && n.nodeType === 3 ) {
					occupants.shift();
					if ( n.nodeValue !== value ) {
						n.nodeValue = value;
					}
				} else {
					n = this.node = doc.createTextNode( value );
					if ( occupants[0] ) {
						target.insertBefore( n, occupants[0] );
					} else {
						target.appendChild( n );
					}
				}

				this.node = n;
			} else {
				this.node = doc.createTextNode( value );
				target.appendChild( this.node );
			}
		};

		Interpolator.prototype.toString = function toString ( escape ) {
			var string = this.getString();
			return escape ? escapeHtml( string ) : string;
		};

		Interpolator.prototype.unrender = function unrender ( shouldDestroy ) {
			if ( shouldDestroy ) this.detach();
			this.rendered = false;
		};

		Interpolator.prototype.update = function update () {
			if ( this.dirty ) {
				this.dirty = false;
				if ( this.rendered ) {
					this.node.data = this.getString();
				}
			}
		};

		Interpolator.prototype.valueOf = function valueOf () {
			return this.model ? this.model.get() : undefined;
		};

		return Interpolator;
	}(Mustache));

	var Input = (function (Element) {
		function Input () {
			Element.apply(this, arguments);
		}

		Input.prototype = Object.create( Element && Element.prototype );
		Input.prototype.constructor = Input;

		Input.prototype.render = function render ( target, occupants ) {
			Element.prototype.render.call( this, target, occupants );
			this.node.defaultValue = this.node.value;
		};

		return Input;
	}(Element));

	var Mapping = (function (Item) {
		function Mapping ( options ) {
			Item.call( this, options );

			this.name = options.template.n;

			this.owner = options.owner || options.parentFragment.owner || options.element || findElement( options.parentFragment );
			this.element = options.element || (this.owner.attributeByName ? this.owner : findElement( options.parentFragment ) );
			this.parentFragment = this.element.parentFragment; // shared
			this.ractive = this.parentFragment.ractive;

			this.fragment = null;

			this.element.attributeByName[ this.name ] = this;

			this.value = options.template.f;
		}

		Mapping.prototype = Object.create( Item && Item.prototype );
		Mapping.prototype.constructor = Mapping;

		Mapping.prototype.bind = function bind () {
			if ( this.fragment ) {
				this.fragment.bind();
			}

			var template = this.template.f;
			var viewmodel = this.element.instance.viewmodel;

			if ( template === 0 ) {
				// empty attributes are `true`
				viewmodel.joinKey( this.name ).set( true );
			}

			else if ( typeof template === 'string' ) {
				var parsed = parseJSON( template );
				viewmodel.joinKey( this.name ).set( parsed ? parsed.value : template );
			}

			else if ( isArray( template ) ) {
				createMapping( this, true );
			}
		};

		Mapping.prototype.render = function render () {};

		Mapping.prototype.unbind = function unbind () {
			if ( this.fragment ) this.fragment.unbind();
			if ( this.boundFragment ) this.boundFragment.unbind();

			if ( this.element.bound ) {
				if ( this.link.target === this.model ) this.link.owner.unlink();
			}
		};

		Mapping.prototype.unrender = function unrender () {};

		Mapping.prototype.update = function update () {
			if ( this.dirty ) {
				this.dirty = false;
				if ( this.fragment ) this.fragment.update();
				if ( this.boundFragment ) this.boundFragment.update();
				if ( this.rendered ) this.updateDelegate();
			}
		};

		return Mapping;
	}(Item));

	function createMapping ( item ) {
		var template = item.template.f;
		var viewmodel = item.element.instance.viewmodel;
		var childData = viewmodel.value;

		if ( template.length === 1 && template[0].t === INTERPOLATOR ) {
			item.model = resolve$2( item.parentFragment, template[0] );

			if ( !item.model ) {
				warnOnceIfDebug( ("The " + (item.name) + "='{{" + (template[0].r) + "}}' mapping is ambiguous, and may cause unexpected results. Consider initialising your data to eliminate the ambiguity"), { ractive: item.element.instance }); // TODO add docs page explaining item
				item.parentFragment.ractive.get( item.name ); // side-effect: create mappings as necessary
				item.model = item.parentFragment.findContext().joinKey( item.name );
			}

			item.link = viewmodel.createLink( item.name, item.model, template[0].r );

			if ( item.model.get() === undefined && item.name in childData ) {
				item.model.set( childData[ item.name ] );
			}
		}

		else {
			item.boundFragment = new Fragment({
				owner: item,
				template: template
			}).bind();

			item.model = viewmodel.joinKey( item.name );
			item.model.set( item.boundFragment.valueOf() );

			// item is a *bit* of a hack
			item.boundFragment.bubble = function () {
				Fragment.prototype.bubble.call( item.boundFragment );
				// defer this to avoid mucking around model deps if there happens to be an expression involved
				runloop.scheduleTask(function () {
					item.boundFragment.update();
					item.model.set( item.boundFragment.valueOf() );
				});
			};
		}
	}

	var Option = (function (Element) {
		function Option ( options ) {
			var template = options.template;
			if ( !template.a ) template.a = {};

			// If the value attribute is missing, use the element's content,
			// as long as it isn't disabled
			if ( template.a.value === undefined && !( 'disabled' in template.a ) ) {
				template.a.value = template.f || '';
			}

			Element.call( this, options );

			this.select = findElement( this.parent || this.parentFragment, false, 'select' );
		}

		Option.prototype = Object.create( Element && Element.prototype );
		Option.prototype.constructor = Option;

		Option.prototype.bind = function bind () {
			if ( !this.select ) {
				Element.prototype.bind.call(this);
				return;
			}

			// If the select has a value, it overrides the `selected` attribute on
			// this option - so we delete the attribute
			var selectedAttribute = this.attributeByName.selected;
			if ( selectedAttribute && this.select.getAttribute( 'value' ) !== undefined ) {
				var index = this.attributes.indexOf( selectedAttribute );
				this.attributes.splice( index, 1 );
				delete this.attributeByName.selected;
			}

			Element.prototype.bind.call(this);
			this.select.options.push( this );
		};

		Option.prototype.bubble = function bubble () {
			// if we're using content as value, may need to update here
			var value = this.getAttribute( 'value' );
			if ( this.node && this.node.value !== value ) {
				this.node._ractive.value = value;
			}
			Element.prototype.bubble.call(this);
		};

		Option.prototype.getAttribute = function getAttribute ( name ) {
			var attribute = this.attributeByName[ name ];
			return attribute ? attribute.getValue() : name === 'value' && this.fragment ? this.fragment.valueOf() : undefined;
		};

		Option.prototype.isSelected = function isSelected () {
			var optionValue = this.getAttribute( 'value' );

			if ( optionValue === undefined || !this.select ) {
				return false;
			}

			var selectValue = this.select.getAttribute( 'value' );

			if ( selectValue == optionValue ) {
				return true;
			}

			if ( this.select.getAttribute( 'multiple' ) && isArray( selectValue ) ) {
				var i = selectValue.length;
				while ( i-- ) {
					if ( selectValue[i] == optionValue ) {
						return true;
					}
				}
			}
		};

		Option.prototype.render = function render ( target, occupants ) {
			Element.prototype.render.call( this, target, occupants );

			if ( !this.attributeByName.value ) {
				this.node._ractive.value = this.getAttribute( 'value' );
			}
		};

		Option.prototype.unbind = function unbind () {
			Element.prototype.unbind.call(this);

			if ( this.select ) {
				removeFromArray( this.select.options, this );
			}
		};

		return Option;
	}(Element));

	function getPartialTemplate ( ractive, name, parentFragment ) {
		// If the partial in instance or view heirarchy instances, great
		var partial = getPartialFromRegistry( ractive, name, parentFragment || {} );
		if ( partial ) return partial;

		// Does it exist on the page as a script tag?
		partial = parser.fromId( name, { noThrow: true } );
		if ( partial ) {
			// parse and register to this ractive instance
			var parsed = parser.parseFor( partial, ractive );

			// register extra partials on the ractive instance if they don't already exist
			if ( parsed.p ) fillGaps( ractive.partials, parsed.p );

			// register (and return main partial if there are others in the template)
			return ractive.partials[ name ] = parsed.t;
		}
	}

	function getPartialFromRegistry ( ractive, name, parentFragment ) {
		// if there was an instance up-hierarchy, cool
		var partial = findParentPartial( name, parentFragment.owner );
		if ( partial ) return partial;

		// find first instance in the ractive or view hierarchy that has this partial
		var instance = findInstance( 'partials', ractive, name );

		if ( !instance ) { return; }

		partial = instance.partials[ name ];

		// partial is a function?
		var fn;
		if ( typeof partial === 'function' ) {
			fn = partial.bind( instance );
			fn.isOwner = instance.partials.hasOwnProperty(name);
			partial = fn.call( ractive, parser );
		}

		if ( !partial && partial !== '' ) {
			warnIfDebug( noRegistryFunctionReturn, name, 'partial', 'partial', { ractive: ractive });
			return;
		}

		// If this was added manually to the registry,
		// but hasn't been parsed, parse it now
		if ( !parser.isParsed( partial ) ) {
			// use the parseOptions of the ractive instance on which it was found
			var parsed = parser.parseFor( partial, instance );

			// Partials cannot contain nested partials!
			// TODO add a test for this
			if ( parsed.p ) {
				warnIfDebug( 'Partials ({{>%s}}) cannot contain nested inline partials', name, { ractive: ractive });
			}

			// if fn, use instance to store result, otherwise needs to go
			// in the correct point in prototype chain on instance or constructor
			var target = fn ? instance : findOwner( instance, name );

			// may be a template with partials, which need to be registered and main template extracted
			target.partials[ name ] = partial = parsed.t;
		}

		// store for reset
		if ( fn ) partial._fn = fn;

		return partial.v ? partial.t : partial;
	}

	function findOwner ( ractive, key ) {
		return ractive.partials.hasOwnProperty( key )
			? ractive
			: findConstructor( ractive.constructor, key);
	}

	function findConstructor ( constructor, key ) {
		if ( !constructor ) { return; }
		return constructor.partials.hasOwnProperty( key )
			? constructor
			: findConstructor( constructor._Parent, key );
	}

	function findParentPartial( name, parent ) {
		if ( parent ) {
			if ( parent.template && parent.template.p && parent.template.p[name] ) {
				return parent.template.p[name];
			} else if ( parent.parentFragment && parent.parentFragment.owner ) {
				return findParentPartial( name, parent.parentFragment.owner );
			}
		}
	}

	var Partial = (function (Mustache) {
		function Partial () {
			Mustache.apply(this, arguments);
		}

		Partial.prototype = Object.create( Mustache && Mustache.prototype );
		Partial.prototype.constructor = Partial;

		Partial.prototype.bind = function bind () {
			// keep track of the reference name for future resets
			this.refName = this.template.r;

			// name matches take priority over expressions
			var template = this.refName ? getPartialTemplate( this.ractive, this.refName, this.parentFragment ) || null : null;
			var templateObj;

			if ( template ) {
				this.named = true;
				this.setTemplate( this.template.r, template );
			}

			if ( !template ) {
				Mustache.prototype.bind.call(this);
				if ( this.model && ( templateObj = this.model.get() ) && typeof templateObj === 'object' && ( typeof templateObj.template === 'string' || isArray( templateObj.t ) ) ) {
					if ( templateObj.template ) {
						this.source = templateObj.template;
						templateObj = parsePartial( this.template.r, templateObj.template, this.ractive );
					} else {
						this.source = templateObj.t;
					}
					this.setTemplate( this.template.r, templateObj.t );
				} else if ( ( !this.model || typeof this.model.get() !== 'string' ) && this.refName ) {
					this.setTemplate( this.refName, template );
				} else {
					this.setTemplate( this.model.get() );
				}
			}

			this.fragment = new Fragment({
				owner: this,
				template: this.partialTemplate
			}).bind();
		};

		Partial.prototype.detach = function detach () {
			return this.fragment.detach();
		};

		Partial.prototype.find = function find ( selector ) {
			return this.fragment.find( selector );
		};

		Partial.prototype.findAll = function findAll ( selector, query ) {
			this.fragment.findAll( selector, query );
		};

		Partial.prototype.findComponent = function findComponent ( name ) {
			return this.fragment.findComponent( name );
		};

		Partial.prototype.findAllComponents = function findAllComponents ( name, query ) {
			this.fragment.findAllComponents( name, query );
		};

		Partial.prototype.firstNode = function firstNode ( skipParent ) {
			return this.fragment.firstNode( skipParent );
		};

		Partial.prototype.forceResetTemplate = function forceResetTemplate () {
			var this$1 = this;

			this.partialTemplate = undefined;

			// on reset, check for the reference name first
			if ( this.refName ) {
				this.partialTemplate = getPartialTemplate( this.ractive, this.refName, this.parentFragment );
			}

			// then look for the resolved name
			if ( !this.partialTemplate ) {
				this.partialTemplate = getPartialTemplate( this.ractive, this.name, this.parentFragment );
			}

			if ( !this.partialTemplate ) {
				warnOnceIfDebug( ("Could not find template for partial '" + (this.name) + "'") );
				this.partialTemplate = [];
			}

			if ( this.inAttribute ) {
				doInAttributes( function () { return this$1.fragment.resetTemplate( this$1.partialTemplate ); } );
			} else {
				this.fragment.resetTemplate( this.partialTemplate );
			}

			this.bubble();
		};

		Partial.prototype.render = function render ( target, occupants ) {
			this.fragment.render( target, occupants );
		};

		Partial.prototype.setTemplate = function setTemplate ( name, template ) {
			this.name = name;

			if ( !template && template !== null ) template = getPartialTemplate( this.ractive, name, this.parentFragment );

			if ( !template ) {
				warnOnceIfDebug( ("Could not find template for partial '" + name + "'") );
			}

			this.partialTemplate = template || [];
		};

		Partial.prototype.toString = function toString ( escape ) {
			return this.fragment.toString( escape );
		};

		Partial.prototype.unbind = function unbind () {
			Mustache.prototype.unbind.call(this);
			this.fragment.unbind();
		};

		Partial.prototype.unrender = function unrender ( shouldDestroy ) {
			this.fragment.unrender( shouldDestroy );
		};

		Partial.prototype.update = function update () {
			var template;

			if ( this.dirty ) {
				this.dirty = false;

				if ( !this.named ) {
					if ( this.model ) {
						template = this.model.get();
					}

					if ( template && typeof template === 'string' && template !== this.name ) {
						this.setTemplate( template );
						this.fragment.resetTemplate( this.partialTemplate );
					} else if ( template && typeof template === 'object' && ( typeof template.template === 'string' || isArray( template.t ) ) ) {
						if ( template.t !== this.source && template.template !== this.source ) {
							if ( template.template ) {
								this.source = template.template;
								template = parsePartial( this.name, template.template, this.ractive );
							} else {
								this.source = template.t;
							}
							this.setTemplate( this.name, template.t );
							this.fragment.resetTemplate( this.partialTemplate );
						}
					}
				}

				this.fragment.update();
			}
		};

		return Partial;
	}(Mustache));

	function parsePartial( name, partial, ractive ) {
		var parsed;

		try {
			parsed = parser.parse( partial, parser.getParseOptions( ractive ) );
		} catch (e) {
			warnIfDebug( ("Could not parse partial from expression '" + name + "'\n" + (e.message)) );
		}

		return parsed || { t: [] };
	}

	var RepeatedFragment = function RepeatedFragment ( options ) {
		this.parent = options.owner.parentFragment;

		// bit of a hack, so reference resolution works without another
		// layer of indirection
		this.parentFragment = this;
		this.owner = options.owner;
		this.ractive = this.parent.ractive;

		// encapsulated styles should be inherited until they get applied by an element
		this.cssIds = 'cssIds' in options ? options.cssIds : ( this.parent ? this.parent.cssIds : null );

		this.context = null;
		this.rendered = false;
		this.iterations = [];

		this.template = options.template;

		this.indexRef = options.indexRef;
		this.keyRef = options.keyRef;

		this.pendingNewIndices = null;
		this.previousIterations = null;

		// track array versus object so updates of type rest
		this.isArray = false;
	};

	RepeatedFragment.prototype.bind = function bind ( context ) {
		var this$1 = this;

			this.context = context;
		var value = context.get();

		// {{#each array}}...
		if ( this.isArray = isArray( value ) ) {
			// we can't use map, because of sparse arrays
			this.iterations = [];
			var max = value.length;
			for ( var i = 0; i < max; i += 1 ) {
				this$1.iterations[i] = this$1.createIteration( i, i );
			}
		}

		// {{#each object}}...
		else if ( isObject( value ) ) {
			this.isArray = false;

			// TODO this is a dreadful hack. There must be a neater way
			if ( this.indexRef ) {
				var refs = this.indexRef.split( ',' );
				this.keyRef = refs[0];
				this.indexRef = refs[1];
			}

			this.iterations = Object.keys( value ).map( function ( key, index ) {
				return this$1.createIteration( key, index );
			});
		}

		return this;
	};

	RepeatedFragment.prototype.bubble = function bubble () {
		this.owner.bubble();
	};

	RepeatedFragment.prototype.createIteration = function createIteration ( key, index ) {
		var fragment = new Fragment({
			owner: this,
			template: this.template
		});

		// TODO this is a bit hacky
		fragment.key = key;
		fragment.index = index;
		fragment.isIteration = true;

		var model = this.context.joinKey( key );

		// set up an iteration alias if there is one
		if ( this.owner.template.z ) {
			fragment.aliases = {};
			fragment.aliases[ this.owner.template.z[0].n ] = model;
		}

		return fragment.bind( model );
	};

	RepeatedFragment.prototype.destroyed = function destroyed () {
		this.iterations.forEach( function ( i ) { return i.destroyed(); } );
	};

	RepeatedFragment.prototype.detach = function detach () {
		var docFrag = createDocumentFragment();
		this.iterations.forEach( function ( fragment ) { return docFrag.appendChild( fragment.detach() ); } );
		return docFrag;
	};

	RepeatedFragment.prototype.find = function find ( selector ) {
		var this$1 = this;

			var len = this.iterations.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			var found = this$1.iterations[i].find( selector );
			if ( found ) return found;
		}
	};

	RepeatedFragment.prototype.findAll = function findAll ( selector, query ) {
		var this$1 = this;

			var len = this.iterations.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			this$1.iterations[i].findAll( selector, query );
		}
	};

	RepeatedFragment.prototype.findComponent = function findComponent ( name ) {
		var this$1 = this;

			var len = this.iterations.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			var found = this$1.iterations[i].findComponent( name );
			if ( found ) return found;
		}
	};

	RepeatedFragment.prototype.findAllComponents = function findAllComponents ( name, query ) {
		var this$1 = this;

			var len = this.iterations.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			this$1.iterations[i].findAllComponents( name, query );
		}
	};

	RepeatedFragment.prototype.findNextNode = function findNextNode ( iteration ) {
		var this$1 = this;

			if ( iteration.index < this.iterations.length - 1 ) {
			for ( var i = iteration.index + 1; i < this$1.iterations.length; i++ ) {
				var node = this$1.iterations[ i ].firstNode( true );
				if ( node ) return node;
			}
		}

		return this.owner.findNextNode();
	};

	RepeatedFragment.prototype.firstNode = function firstNode ( skipParent ) {
		return this.iterations[0] ? this.iterations[0].firstNode( skipParent ) : null;
	};

	RepeatedFragment.prototype.rebinding = function rebinding ( next ) {
		var this$1 = this;

			this.context = next;
		this.iterations.forEach( function ( fragment ) {
			var model = next ? next.joinKey( fragment.key || fragment.index ) : undefined;
			fragment.context = model;
			if ( this$1.owner.template.z ) {
				fragment.aliases = {};
				fragment.aliases[ this$1.owner.template.z[0].n ] = model;
			}
		});
	};

	RepeatedFragment.prototype.render = function render ( target, occupants ) {
		// TODO use docFrag.cloneNode...

		if ( this.iterations ) {
			this.iterations.forEach( function ( fragment ) { return fragment.render( target, occupants ); } );
		}

		this.rendered = true;
	};

	RepeatedFragment.prototype.shuffle = function shuffle ( newIndices ) {
		var this$1 = this;

			if ( !this.pendingNewIndices ) this.previousIterations = this.iterations.slice();

		if ( !this.pendingNewIndices ) this.pendingNewIndices = [];

		this.pendingNewIndices.push( newIndices );

		var iterations = [];

		newIndices.forEach( function ( newIndex, oldIndex ) {
			if ( newIndex === -1 ) return;

			var fragment = this$1.iterations[ oldIndex ];
			iterations[ newIndex ] = fragment;

			if ( newIndex !== oldIndex && fragment ) fragment.dirty = true;
		});

		this.iterations = iterations;

		this.bubble();
	};

	RepeatedFragment.prototype.shuffled = function shuffled () {
		this.iterations.forEach( function ( i ) { return i.shuffled(); } );
	};

	RepeatedFragment.prototype.toString = function toString$1$$ ( escape ) {
		return this.iterations ?
			this.iterations.map( escape ? toEscapedString : toString$1 ).join( '' ) :
			'';
	};

	RepeatedFragment.prototype.unbind = function unbind$1 () {
		this.iterations.forEach( unbind );
		return this;
	};

	RepeatedFragment.prototype.unrender = function unrender$1 ( shouldDestroy ) {
		this.iterations.forEach( shouldDestroy ? unrenderAndDestroy : unrender );
		if ( this.pendingNewIndices && this.previousIterations ) {
			this.previousIterations.forEach( function ( fragment ) {
				if ( fragment.rendered ) shouldDestroy ? unrenderAndDestroy( fragment ) : unrender( fragment );
			});
		}
		this.rendered = false;
	};

	// TODO smart update
	RepeatedFragment.prototype.update = function update$1 () {
		// skip dirty check, since this is basically just a facade

		var this$1 = this;

			if ( this.pendingNewIndices ) {
			this.updatePostShuffle();
			return;
		}

		if ( this.updating ) return;
		this.updating = true;

		var value = this.context.get(),
				  wasArray = this.isArray;

		var toRemove;
		var oldKeys;
		var reset = true;
		var i;

		if ( this.isArray = isArray( value ) ) {
			if ( wasArray ) {
				reset = false;
				if ( this.iterations.length > value.length ) {
					toRemove = this.iterations.splice( value.length );
				}
			}
		} else if ( isObject( value ) && !wasArray ) {
			reset = false;
			toRemove = [];
			oldKeys = {};
			i = this.iterations.length;

			while ( i-- ) {
				var fragment$1 = this$1.iterations[i];
				if ( fragment$1.key in value ) {
					oldKeys[ fragment$1.key ] = true;
				} else {
					this$1.iterations.splice( i, 1 );
					toRemove.push( fragment$1 );
				}
			}
		}

		if ( reset ) {
			toRemove = this.iterations;
			this.iterations = [];
		}

		if ( toRemove ) {
			toRemove.forEach( function ( fragment ) {
				fragment.unbind();
				fragment.unrender( true );
			});
		}

		// update the remaining ones
		this.iterations.forEach( update );

		// add new iterations
		var newLength = isArray( value ) ?
			value.length :
			isObject( value ) ?
				Object.keys( value ).length :
				0;

		var docFrag;
		var fragment;

		if ( newLength > this.iterations.length ) {
			docFrag = this.rendered ? createDocumentFragment() : null;
			i = this.iterations.length;

			if ( isArray( value ) ) {
				while ( i < value.length ) {
					fragment = this$1.createIteration( i, i );

					this$1.iterations.push( fragment );
					if ( this$1.rendered ) fragment.render( docFrag );

					i += 1;
				}
			}

			else if ( isObject( value ) ) {
				// TODO this is a dreadful hack. There must be a neater way
				if ( this.indexRef && !this.keyRef ) {
					var refs = this.indexRef.split( ',' );
					this.keyRef = refs[0];
					this.indexRef = refs[1];
				}

				Object.keys( value ).forEach( function ( key ) {
					if ( !oldKeys || !( key in oldKeys ) ) {
						fragment = this$1.createIteration( key, i );

						this$1.iterations.push( fragment );
						if ( this$1.rendered ) fragment.render( docFrag );

						i += 1;
					}
				});
			}

			if ( this.rendered ) {
				var parentNode = this.parent.findParentNode();
				var anchor = this.parent.findNextNode( this.owner );

				parentNode.insertBefore( docFrag, anchor );
			}
		}

		this.updating = false;
	};

	RepeatedFragment.prototype.updatePostShuffle = function updatePostShuffle () {
		var this$1 = this;

			var newIndices = this.pendingNewIndices[ 0 ];

		// map first shuffle through
		this.pendingNewIndices.slice( 1 ).forEach( function ( indices ) {
			newIndices.forEach( function ( newIndex, oldIndex ) {
				newIndices[ oldIndex ] = indices[ newIndex ];
			});
		});

		// This algorithm (for detaching incorrectly-ordered fragments from the DOM and
		// storing them in a document fragment for later reinsertion) seems a bit hokey,
		// but it seems to work for now
		var len = this.context.get().length, oldLen = this.previousIterations.length;
		var i;
		var removed = {};

		newIndices.forEach( function ( newIndex, oldIndex ) {
			var fragment = this$1.previousIterations[ oldIndex ];
			this$1.previousIterations[ oldIndex ] = null;

			if ( newIndex === -1 ) {
				removed[ oldIndex ] = fragment;
			} else if ( fragment.index !== newIndex ) {
				var model = this$1.context.joinKey( newIndex );
				fragment.index = newIndex;
				fragment.context = model;
				if ( this$1.owner.template.z ) {
					fragment.aliases = {};
					fragment.aliases[ this$1.owner.template.z[0].n ] = model;
				}
			}
		});

		// if the array was spliced outside of ractive, sometimes there are leftover fragments not in the newIndices
		this.previousIterations.forEach( function ( frag, i ) {
			if ( frag ) removed[ i ] = frag;
		});

		// create new/move existing iterations
		var docFrag = this.rendered ? createDocumentFragment() : null;
		var parentNode = this.rendered ? this.parent.findParentNode() : null;

		var contiguous = 'startIndex' in newIndices;
		i = contiguous ? newIndices.startIndex : 0;

		for ( i; i < len; i++ ) {
			var frag = this$1.iterations[i];

			if ( frag && contiguous ) {
				// attach any built-up iterations
				if ( this$1.rendered ) {
					if ( removed[i] ) docFrag.appendChild( removed[i].detach() );
					if ( docFrag.childNodes.length  ) parentNode.insertBefore( docFrag, frag.firstNode() );
				}
				continue;
			}

			if ( !frag ) this$1.iterations[i] = this$1.createIteration( i, i );

			if ( this$1.rendered ) {
				if ( removed[i] ) docFrag.appendChild( removed[i].detach() );

				if ( frag ) docFrag.appendChild( frag.detach() );
				else {
					this$1.iterations[i].render( docFrag );
				}
			}
		}

		// append any leftovers
		if ( this.rendered ) {
			for ( i = len; i < oldLen; i++ ) {
				if ( removed[i] ) docFrag.appendChild( removed[i].detach() );
			}

			if ( docFrag.childNodes.length ) {
				parentNode.insertBefore( docFrag, this.owner.findNextNode() );
			}
		}

		// trigger removal on old nodes
		Object.keys( removed ).forEach( function ( k ) { return removed[k].unbind().unrender( true ); } );

		this.iterations.forEach( update );

		this.pendingNewIndices = null;

		this.shuffled();
	};

	function isEmpty ( value ) {
		return !value ||
		       ( isArray( value ) && value.length === 0 ) ||
			   ( isObject( value ) && Object.keys( value ).length === 0 );
	}

	function getType ( value, hasIndexRef ) {
		if ( hasIndexRef || isArray( value ) ) return SECTION_EACH;
		if ( isObject( value ) || typeof value === 'function' ) return SECTION_IF_WITH;
		if ( value === undefined ) return null;
		return SECTION_IF;
	}

	var Section = (function (Mustache) {
		function Section ( options ) {
			Mustache.call( this, options );

			this.sectionType = options.template.n || null;
			this.templateSectionType = this.sectionType;
			this.subordinate = options.template.l === 1;
			this.fragment = null;
		}

		Section.prototype = Object.create( Mustache && Mustache.prototype );
		Section.prototype.constructor = Section;

		Section.prototype.bind = function bind () {
			Mustache.prototype.bind.call(this);

			if ( this.subordinate ) {
				this.sibling = this.parentFragment.items[ this.parentFragment.items.indexOf( this ) - 1 ];
				this.sibling.nextSibling = this;
			}

			// if we managed to bind, we need to create children
			if ( this.model ) {
				this.dirty = true;
				this.update();
			} else if ( this.sectionType && this.sectionType === SECTION_UNLESS && ( !this.sibling || !this.sibling.isTruthy() ) ) {
				this.fragment = new Fragment({
					owner: this,
					template: this.template.f
				}).bind();
			}
		};

		Section.prototype.detach = function detach () {
			return this.fragment ? this.fragment.detach() : createDocumentFragment();
		};

		Section.prototype.find = function find ( selector ) {
			if ( this.fragment ) {
				return this.fragment.find( selector );
			}
		};

		Section.prototype.findAll = function findAll ( selector, query ) {
			if ( this.fragment ) {
				this.fragment.findAll( selector, query );
			}
		};

		Section.prototype.findComponent = function findComponent ( name ) {
			if ( this.fragment ) {
				return this.fragment.findComponent( name );
			}
		};

		Section.prototype.findAllComponents = function findAllComponents ( name, query ) {
			if ( this.fragment ) {
				this.fragment.findAllComponents( name, query );
			}
		};

		Section.prototype.firstNode = function firstNode ( skipParent ) {
			return this.fragment && this.fragment.firstNode( skipParent );
		};

		Section.prototype.isTruthy = function isTruthy () {
			if ( this.subordinate && this.sibling.isTruthy() ) return true;
			var value = !this.model ? undefined : this.model.isRoot ? this.model.value : this.model.get();
			return !!value && ( this.templateSectionType === SECTION_IF_WITH || !isEmpty( value ) );
		};

		Section.prototype.rebinding = function rebinding ( next, previous, safe ) {
			if ( Mustache.prototype.rebinding.call( this, next, previous, safe ) ) {
				if ( this.fragment && this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ) {
					this.fragment.rebinding( next, previous );
				}
			}
		};

		Section.prototype.render = function render ( target, occupants ) {
			this.rendered = true;
			if ( this.fragment ) this.fragment.render( target, occupants );
		};

		Section.prototype.shuffle = function shuffle ( newIndices ) {
			if ( this.fragment && this.sectionType === SECTION_EACH ) {
				this.fragment.shuffle( newIndices );
			}
		};

		Section.prototype.toString = function toString ( escape ) {
			return this.fragment ? this.fragment.toString( escape ) : '';
		};

		Section.prototype.unbind = function unbind () {
			Mustache.prototype.unbind.call(this);
			if ( this.fragment ) this.fragment.unbind();
		};

		Section.prototype.unrender = function unrender ( shouldDestroy ) {
			if ( this.rendered && this.fragment ) this.fragment.unrender( shouldDestroy );
			this.rendered = false;
		};

		Section.prototype.update = function update () {
			if ( !this.dirty ) return;

			if ( this.fragment && this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ) {
				this.fragment.context = this.model;
			}

			if ( !this.model && this.sectionType !== SECTION_UNLESS ) return;

			this.dirty = false;

			var value = !this.model ? undefined : this.model.isRoot ? this.model.value : this.model.get();
			var siblingFalsey = !this.subordinate || !this.sibling.isTruthy();
			var lastType = this.sectionType;

			// watch for switching section types
			if ( this.sectionType === null || this.templateSectionType === null ) this.sectionType = getType( value, this.template.i );
			if ( lastType && lastType !== this.sectionType && this.fragment ) {
				if ( this.rendered ) {
					this.fragment.unbind().unrender( true );
				}

				this.fragment = null;
			}

			var newFragment;

			var fragmentShouldExist = this.sectionType === SECTION_EACH || // each always gets a fragment, which may have no iterations
			                            this.sectionType === SECTION_WITH || // with (partial context) always gets a fragment
			                            ( siblingFalsey && ( this.sectionType === SECTION_UNLESS ? !this.isTruthy() : this.isTruthy() ) ); // if, unless, and if-with depend on siblings and the condition

			if ( fragmentShouldExist ) {
				if ( this.fragment ) {
					this.fragment.update();
				} else {
					if ( this.sectionType === SECTION_EACH ) {
						newFragment = new RepeatedFragment({
							owner: this,
							template: this.template.f,
							indexRef: this.template.i
						}).bind( this.model );
					} else {
		 				// only with and if-with provide context - if and unless do not
						var context = this.sectionType !== SECTION_IF && this.sectionType !== SECTION_UNLESS ? this.model : null;
						newFragment = new Fragment({
							owner: this,
							template: this.template.f
						}).bind( context );
					}
				}
			} else {
				if ( this.fragment && this.rendered ) {
					this.fragment.unbind().unrender( true );
				}

				this.fragment = null;
			}

			if ( newFragment ) {
				if ( this.rendered ) {
					var parentNode = this.parentFragment.findParentNode();
					var anchor = this.parentFragment.findNextNode( this );

					if ( anchor ) {
						var docFrag = createDocumentFragment();
						newFragment.render( docFrag );

						// we use anchor.parentNode, not parentNode, because the sibling
						// may be temporarily detached as a result of a shuffle
						anchor.parentNode.insertBefore( docFrag, anchor );
					} else {
						newFragment.render( parentNode );
					}
				}

				this.fragment = newFragment;
			}

			if ( this.nextSibling ) {
				this.nextSibling.dirty = true;
				this.nextSibling.update();
			}
		};

		return Section;
	}(Mustache));

	function valueContains ( selectValue, optionValue ) {
		var i = selectValue.length;
		while ( i-- ) {
			if ( selectValue[i] == optionValue ) return true;
		}
	}

	var Select = (function (Element) {
		function Select ( options ) {
			Element.call( this, options );
			this.options = [];
		}

		Select.prototype = Object.create( Element && Element.prototype );
		Select.prototype.constructor = Select;

		Select.prototype.foundNode = function foundNode ( node ) {
			if ( this.binding ) {
				var selectedOptions = getSelectedOptions( node );

				if ( selectedOptions.length > 0 ) {
					this.selectedOptions = selectedOptions;
				}
			}
		};

		Select.prototype.render = function render ( target, occupants ) {
			Element.prototype.render.call( this, target, occupants );
			this.sync();

			var node = this.node;

			var i = node.options.length;
			while ( i-- ) {
				node.options[i].defaultSelected = node.options[i].selected;
			}

			this.rendered = true;
		};

		Select.prototype.sync = function sync () {
			var this$1 = this;

			var selectNode = this.node;

			if ( !selectNode ) return;

			var options = toArray( selectNode.options );

			if ( this.selectedOptions ) {
				options.forEach( function ( o ) {
					if ( this$1.selectedOptions.indexOf( o ) >= 0 ) o.selected = true;
					else o.selected = false;
				});
				this.binding.setFromNode( selectNode );
				delete this.selectedOptions;
				return;
			}

			var selectValue = this.getAttribute( 'value' );
			var isMultiple = this.getAttribute( 'multiple' );
			var array = isMultiple && isArray( selectValue );

			// If the <select> has a specified value, that should override
			// these options
			if ( selectValue !== undefined ) {
				var optionWasSelected;

				options.forEach( function ( o ) {
					var optionValue = o._ractive ? o._ractive.value : o.value;
					var shouldSelect = isMultiple ? array && valueContains( selectValue, optionValue ) : selectValue == optionValue;

					if ( shouldSelect ) {
						optionWasSelected = true;
					}

					o.selected = shouldSelect;
				});

				if ( !optionWasSelected && !isMultiple ) {
					if ( this.binding ) {
						this.binding.forceUpdate();
					}
				}
			}

			// Otherwise the value should be initialised according to which
			// <option> element is selected, if twoway binding is in effect
			else if ( this.binding ) {
				this.binding.forceUpdate();
			}
		};

		Select.prototype.update = function update () {
			Element.prototype.update.call(this);
			this.sync();
		};

		return Select;
	}(Element));

	var Textarea = (function (Input) {
		function Textarea( options ) {
			var template = options.template;

			options.deferContent = true;

			Input.call( this, options );

			// check for single interpolator binding
			if ( !this.attributeByName.value ) {
				if ( template.f && isBindable( { template: template } ) ) {
					this.attributes.push( createItem( {
						owner: this,
						template: { t: ATTRIBUTE, f: template.f, n: 'value' },
						parentFragment: this.parentFragment
					} ) );
				} else {
					this.fragment = new Fragment({ owner: this, cssIds: null, template: template.f });
				}
			}
		}

		Textarea.prototype = Object.create( Input && Input.prototype );
		Textarea.prototype.constructor = Textarea;

		Textarea.prototype.bubble = function bubble () {
			var this$1 = this;

			if ( !this.dirty ) {
				this.dirty = true;

				if ( this.rendered && !this.binding && this.fragment ) {
					runloop.scheduleTask( function () {
						this$1.dirty = false;
						this$1.node.value = this$1.fragment.toString();
					});
				}

				this.parentFragment.bubble(); // default behaviour
			}
		};

		return Textarea;
	}(Input));

	var Text = (function (Item) {
		function Text ( options ) {
			Item.call( this, options );
			this.type = TEXT;
		}

		Text.prototype = Object.create( Item && Item.prototype );
		Text.prototype.constructor = Text;

		Text.prototype.bind = function bind () {
			// noop
		};

		Text.prototype.detach = function detach () {
			return detachNode( this.node );
		};

		Text.prototype.firstNode = function firstNode () {
			return this.node;
		};

		Text.prototype.render = function render ( target, occupants ) {
			if ( inAttributes() ) return;
			this.rendered = true;

			if ( occupants ) {
				var n = occupants[0];
				if ( n && n.nodeType === 3 ) {
					occupants.shift();
					if ( n.nodeValue !== this.template ) {
						n.nodeValue = this.template;
					}
				} else {
					n = this.node = doc.createTextNode( this.template );
					if ( occupants[0] ) {
						target.insertBefore( n, occupants[0] );
					} else {
						target.appendChild( n );
					}
				}

				this.node = n;
			} else {
				this.node = doc.createTextNode( this.template );
				target.appendChild( this.node );
			}
		};

		Text.prototype.toString = function toString ( escape ) {
			return escape ? escapeHtml( this.template ) : this.template;
		};

		Text.prototype.unbind = function unbind () {
			// noop
		};

		Text.prototype.unrender = function unrender ( shouldDestroy ) {
			if ( this.rendered && shouldDestroy ) this.detach();
			this.rendered = false;
		};

		Text.prototype.update = function update () {
			// noop
		};

		Text.prototype.valueOf = function valueOf () {
			return this.template;
		};

		return Text;
	}(Item));

	function camelCase ( hyphenatedStr ) {
		return hyphenatedStr.replace( /-([a-zA-Z])/g, function ( match, $1 ) {
			return $1.toUpperCase();
		});
	}

	var prefix;

	if ( !isClient ) {
		prefix = null;
	} else {
		var prefixCache = {};
		var testStyle = createElement( 'div' ).style;

		prefix = function ( prop ) {
			prop = camelCase( prop );

			if ( !prefixCache[ prop ] ) {
				if ( testStyle[ prop ] !== undefined ) {
					prefixCache[ prop ] = prop;
				}

				else {
					// test vendors...
					var capped = prop.charAt( 0 ).toUpperCase() + prop.substring( 1 );

					var i = vendors.length;
					while ( i-- ) {
						var vendor = vendors[i];
						if ( testStyle[ vendor + capped ] !== undefined ) {
							prefixCache[ prop ] = vendor + capped;
							break;
						}
					}
				}
			}

			return prefixCache[ prop ];
		};
	}

	var prefix$1 = prefix;

	var visible;
	var hidden = 'hidden';

	if ( doc ) {
		var prefix$2;

		if ( hidden in doc ) {
			prefix$2 = '';
		} else {
			var i$1 = vendors.length;
			while ( i$1-- ) {
				var vendor = vendors[i$1];
				hidden = vendor + 'Hidden';

				if ( hidden in doc ) {
					prefix$2 = vendor;
					break;
				}
			}
		}

		if ( prefix$2 !== undefined ) {
			doc.addEventListener( prefix$2 + 'visibilitychange', onChange );
			onChange();
		} else {
			// gah, we're in an old browser
			if ( 'onfocusout' in doc ) {
				doc.addEventListener( 'focusout', onHide );
				doc.addEventListener( 'focusin', onShow );
			}

			else {
				win.addEventListener( 'pagehide', onHide );
				win.addEventListener( 'blur', onHide );

				win.addEventListener( 'pageshow', onShow );
				win.addEventListener( 'focus', onShow );
			}

			visible = true; // until proven otherwise. Not ideal but hey
		}
	}

	function onChange () {
		visible = !doc[ hidden ];
	}

	function onHide () {
		visible = false;
	}

	function onShow () {
		visible = true;
	}

	var unprefixPattern = new RegExp( '^-(?:' + vendors.join( '|' ) + ')-' );

	function unprefix ( prop ) {
		return prop.replace( unprefixPattern, '' );
	}

	var vendorPattern = new RegExp( '^(?:' + vendors.join( '|' ) + ')([A-Z])' );

	function hyphenate ( str ) {
		if ( !str ) return ''; // edge case

		if ( vendorPattern.test( str ) ) str = '-' + str;

		return str.replace( /[A-Z]/g, function ( match ) { return '-' + match.toLowerCase(); } );
	}

	var createTransitions;

	if ( !isClient ) {
		createTransitions = null;
	} else {
		var testStyle$1 = createElement( 'div' ).style;
		var linear$1 = function ( x ) { return x; };

		var canUseCssTransitions = {};
		var cannotUseCssTransitions = {};

		// determine some facts about our environment
		var TRANSITION$1;
		var TRANSITIONEND;
		var CSS_TRANSITIONS_ENABLED;
		var TRANSITION_DURATION;
		var TRANSITION_PROPERTY;
		var TRANSITION_TIMING_FUNCTION;

		if ( testStyle$1.transition !== undefined ) {
			TRANSITION$1 = 'transition';
			TRANSITIONEND = 'transitionend';
			CSS_TRANSITIONS_ENABLED = true;
		} else if ( testStyle$1.webkitTransition !== undefined ) {
			TRANSITION$1 = 'webkitTransition';
			TRANSITIONEND = 'webkitTransitionEnd';
			CSS_TRANSITIONS_ENABLED = true;
		} else {
			CSS_TRANSITIONS_ENABLED = false;
		}

		if ( TRANSITION$1 ) {
			TRANSITION_DURATION = TRANSITION$1 + 'Duration';
			TRANSITION_PROPERTY = TRANSITION$1 + 'Property';
			TRANSITION_TIMING_FUNCTION = TRANSITION$1 + 'TimingFunction';
		}

		createTransitions = function ( t, to, options, changedProperties, resolve ) {

			// Wait a beat (otherwise the target styles will be applied immediately)
			// TODO use a fastdom-style mechanism?
			setTimeout( function () {
				var jsTransitionsComplete;
				var cssTransitionsComplete;
				var cssTimeout;

				function transitionDone () { clearTimeout( cssTimeout ); }

				function checkComplete () {
					if ( jsTransitionsComplete && cssTransitionsComplete ) {
						t.unregisterCompleteHandler( transitionDone );
						// will changes to events and fire have an unexpected consequence here?
						t.ractive.fire( t.name + ':end', t.node, t.isIntro );
						resolve();
					}
				}

				// this is used to keep track of which elements can use CSS to animate
				// which properties
				var hashPrefix = ( t.node.namespaceURI || '' ) + t.node.tagName;

				// need to reset transition properties
				var style = t.node.style;
				var previous = {
					property: style[ TRANSITION_PROPERTY ],
					timing: style[ TRANSITION_TIMING_FUNCTION ],
					duration: style[ TRANSITION_DURATION ]
				};

				style[ TRANSITION_PROPERTY ] = changedProperties.map( prefix$1 ).map( hyphenate ).join( ',' );
				style[ TRANSITION_TIMING_FUNCTION ] = hyphenate( options.easing || 'linear' );
				style[ TRANSITION_DURATION ] = ( options.duration / 1000 ) + 's';

				function transitionEndHandler ( event ) {
					var index = changedProperties.indexOf( camelCase( unprefix( event.propertyName ) ) );

					if ( index !== -1 ) {
						changedProperties.splice( index, 1 );
					}

					if ( changedProperties.length ) {
						// still transitioning...
						return;
					}

					clearTimeout( cssTimeout );
					cssTransitionsDone();
				}

				function cssTransitionsDone () {
					style[ TRANSITION_PROPERTY ] = previous.property;
					style[ TRANSITION_TIMING_FUNCTION ] = previous.duration;
					style[ TRANSITION_DURATION ] = previous.timing;

					t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );

					cssTransitionsComplete = true;
					checkComplete();
				}

				t.node.addEventListener( TRANSITIONEND, transitionEndHandler, false );

				// safety net in case transitionend never fires
				cssTimeout = setTimeout( function () {
					changedProperties = [];
					cssTransitionsDone();
				}, options.duration + ( options.delay || 0 ) + 50 );
				t.registerCompleteHandler( transitionDone );

				setTimeout( function () {
					var i = changedProperties.length;
					var hash;
					var originalValue;
					var index;
					var propertiesToTransitionInJs = [];
					var prop;
					var suffix;
					var interpolator;

					while ( i-- ) {
						prop = changedProperties[i];
						hash = hashPrefix + prop;

						if ( CSS_TRANSITIONS_ENABLED && !cannotUseCssTransitions[ hash ] ) {
							style[ prefix$1( prop ) ] = to[ prop ];

							// If we're not sure if CSS transitions are supported for
							// this tag/property combo, find out now
							if ( !canUseCssTransitions[ hash ] ) {
								originalValue = t.getStyle( prop );

								// if this property is transitionable in this browser,
								// the current style will be different from the target style
								canUseCssTransitions[ hash ] = ( t.getStyle( prop ) != to[ prop ] );
								cannotUseCssTransitions[ hash ] = !canUseCssTransitions[ hash ];

								// Reset, if we're going to use timers after all
								if ( cannotUseCssTransitions[ hash ] ) {
									style[ prefix$1( prop ) ] = originalValue;
								}
							}
						}

						if ( !CSS_TRANSITIONS_ENABLED || cannotUseCssTransitions[ hash ] ) {
							// we need to fall back to timer-based stuff
							if ( originalValue === undefined ) {
								originalValue = t.getStyle( prop );
							}

							// need to remove this from changedProperties, otherwise transitionEndHandler
							// will get confused
							index = changedProperties.indexOf( prop );
							if ( index === -1 ) {
								warnIfDebug( 'Something very strange happened with transitions. Please raise an issue at https://github.com/ractivejs/ractive/issues - thanks!', { node: t.node });
							} else {
								changedProperties.splice( index, 1 );
							}

							// TODO Determine whether this property is animatable at all

							suffix = /[^\d]*$/.exec( to[ prop ] )[0];
							interpolator = interpolate( parseFloat( originalValue ), parseFloat( to[ prop ] ) ) || ( function () { return to[ prop ]; } );

							// ...then kick off a timer-based transition
							propertiesToTransitionInJs.push({
								name: prefix$1( prop ),
								interpolator: interpolator,
								suffix: suffix
							});
						}
					}

					// javascript transitions
					if ( propertiesToTransitionInJs.length ) {
						var easing;

						if ( typeof options.easing === 'string' ) {
							easing = t.ractive.easing[ options.easing ];

							if ( !easing ) {
								warnOnceIfDebug( missingPlugin( options.easing, 'easing' ) );
								easing = linear$1;
							}
						} else if ( typeof options.easing === 'function' ) {
							easing = options.easing;
						} else {
							easing = linear$1;
						}

						new Ticker({
							duration: options.duration,
							easing: easing,
							step: function ( pos ) {
								var i = propertiesToTransitionInJs.length;
								while ( i-- ) {
									var prop = propertiesToTransitionInJs[i];
									t.node.style[ prop.name ] = prop.interpolator( pos ) + prop.suffix;
								}
							},
							complete: function () {
								jsTransitionsComplete = true;
								checkComplete();
							}
						});
					} else {
						jsTransitionsComplete = true;
					}

					if ( !changedProperties.length ) {
						// We need to cancel the transitionEndHandler, and deal with
						// the fact that it will never fire
						t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
						cssTransitionsComplete = true;
						checkComplete();
					}
				}, 0 );
			}, options.delay || 0 );
		};
	}

	var createTransitions$1 = createTransitions;

	function resetStyle ( node, style ) {
		if ( style ) {
			node.setAttribute( 'style', style );
		} else {
			// Next line is necessary, to remove empty style attribute!
			// See http://stackoverflow.com/a/7167553
			node.getAttribute( 'style' );
			node.removeAttribute( 'style' );
		}
	}

	var getComputedStyle = win && ( win.getComputedStyle || legacy.getComputedStyle );
	var resolved = Promise$1.resolve();

	var names = {
		t0: 'intro-outro',
		t1: 'intro',
		t2: 'outro'
	};

	var Transition = function Transition ( options ) {
		this.owner = options.owner || options.parentFragment.owner || findElement( options.parentFragment );
		this.element = this.owner.attributeByName ? this.owner : findElement( options.parentFragment );
		this.ractive = this.owner.ractive;
		this.template = options.template;
		this.parentFragment = options.parentFragment;
		this.options = options;
		this.onComplete = [];
	};

	Transition.prototype.animateStyle = function animateStyle ( style, value, options ) {
		var this$1 = this;

			if ( arguments.length === 4 ) {
			throw new Error( 't.animateStyle() returns a promise - use .then() instead of passing a callback' );
		}

		// Special case - page isn't visible. Don't animate anything, because
		// that way you'll never get CSS transitionend events
		if ( !visible ) {
			this.setStyle( style, value );
			return resolved;
		}

		var to;

		if ( typeof style === 'string' ) {
			to = {};
			to[ style ] = value;
		} else {
			to = style;

			// shuffle arguments
			options = value;
		}

		// As of 0.3.9, transition authors should supply an `option` object with
		// `duration` and `easing` properties (and optional `delay`), plus a
		// callback function that gets called after the animation completes

		// TODO remove this check in a future version
		if ( !options ) {
			warnOnceIfDebug( 'The "%s" transition does not supply an options object to `t.animateStyle()`. This will break in a future version of Ractive. For more info see https://github.com/RactiveJS/Ractive/issues/340', this.name );
			options = this;
		}

		return new Promise$1( function ( fulfil ) {
			// Edge case - if duration is zero, set style synchronously and complete
			if ( !options.duration ) {
				this$1.setStyle( to );
				fulfil();
				return;
			}

			// Get a list of the properties we're animating
			var propertyNames = Object.keys( to );
			var changedProperties = [];

			// Store the current styles
			var computedStyle = getComputedStyle( this$1.node );

			var i = propertyNames.length;
			while ( i-- ) {
				var prop = propertyNames[i];
				var current = computedStyle[ prefix$1( prop ) ];

				if ( current === '0px' ) current = 0;

				// we need to know if we're actually changing anything
				if ( current != to[ prop ] ) { // use != instead of !==, so we can compare strings with numbers
					changedProperties.push( prop );

					// make the computed style explicit, so we can animate where
					// e.g. height='auto'
					this$1.node.style[ prefix$1( prop ) ] = current;
				}
			}

			// If we're not actually changing anything, the transitionend event
			// will never fire! So we complete early
			if ( !changedProperties.length ) {
				fulfil();
				return;
			}

			createTransitions$1( this$1, to, options, changedProperties, fulfil );
		});
	};

	Transition.prototype.bind = function bind () {
		var this$1 = this;

			var options = this.options;
		var type = options.template && options.template.v;
		if ( type ) {
			if ( type === 't0' || type === 't1' ) this.element._introTransition = this;
			if ( type === 't0' || type === 't2' ) this.element._outroTransition = this;
			this.eventName = names[ type ];
		}

		var ractive = this.owner.ractive;

		if ( options.name ) {
			this.name = options.name;
		} else {
			var name = options.template.f;
			if ( typeof name.n === 'string' ) name = name.n;

			if ( typeof name !== 'string' ) {
				var fragment = new Fragment({
					owner: this.owner,
					template: name.n
				}).bind(); // TODO need a way to capture values without bind()

				name = fragment.toString();
				fragment.unbind();

				if ( name === '' ) {
					// empty string okay, just no transition
					return;
				}
			}

			this.name = name;
		}

		if ( options.params ) {
			this.params = options.params;
		} else {
			if ( options.template.f.a && !options.template.f.a.s ) {
				this.params = options.template.f.a;
			}

			else if ( options.template.f.d ) {
				// TODO is there a way to interpret dynamic arguments without all the
				// 'dependency thrashing'?
				var fragment$1 = new Fragment({
					owner: this.owner,
					template: options.template.f.d
				}).bind();

				this.params = fragment$1.getArgsList();
				fragment$1.unbind();
			}
		}

		if ( typeof this.name === 'function' ) {
			this._fn = this.name;
			this.name = this._fn.name;
		} else {
			this._fn = findInViewHierarchy( 'transitions', ractive, this.name );
		}

		if ( !this._fn ) {
			warnOnceIfDebug( missingPlugin( this.name, 'transition' ), { ractive: ractive });
		}

		// TODO: dry up after deprecation is done
		if ( options.template && this.template.f.a && this.template.f.a.s ) {
			this.resolvers = [];
			this.models = this.template.f.a.r.map( function ( ref, i ) {
				var resolver;
				var model = resolveReference( this$1.parentFragment, ref );
				if ( !model ) {
					resolver = this$1.parentFragment.resolve( ref, function ( model ) {
						this$1.models[i] = model;
						removeFromArray( this$1.resolvers, resolver );
						model.register( this$1 );
					});

					this$1.resolvers.push( resolver );
				} else model.register( this$1 );

				return model;
			});
			this.argsFn = getFunction( this.template.f.a.s, this.template.f.a.r.length );
		}
	};

	Transition.prototype.destroyed = function destroyed () {};

	Transition.prototype.getStyle = function getStyle ( props ) {
		var computedStyle = getComputedStyle( this.node );

		if ( typeof props === 'string' ) {
			var value = computedStyle[ prefix$1( props ) ];
			return value === '0px' ? 0 : value;
		}

		if ( !isArray( props ) ) {
			throw new Error( 'Transition$getStyle must be passed a string, or an array of strings representing CSS properties' );
		}

		var styles = {};

		var i = props.length;
		while ( i-- ) {
			var prop = props[i];
			var value$1 = computedStyle[ prefix$1( prop ) ];

			if ( value$1 === '0px' ) value$1 = 0;
			styles[ prop ] = value$1;
		}

		return styles;
	};

	Transition.prototype.handleChange = function handleChange () {};

	Transition.prototype.processParams = function processParams ( params, defaults ) {
		if ( typeof params === 'number' ) {
			params = { duration: params };
		}

		else if ( typeof params === 'string' ) {
			if ( params === 'slow' ) {
				params = { duration: 600 };
			} else if ( params === 'fast' ) {
				params = { duration: 200 };
			} else {
				params = { duration: 400 };
			}
		} else if ( !params ) {
			params = {};
		}

		return extendObj( {}, defaults, params );
	};

	Transition.prototype.rebinding = function rebinding ( next, previous ) {
		var idx = this.models.indexOf( previous );
		if ( !~idx ) return;

		next = rebindMatch( this.template.f.a.r[ idx ], next, previous );
		if ( next === previous ) return;

		previous.unregister( this );
		this.models.splice( idx, 1, next );
		if ( next ) next.addShuffleRegister( this, 'mark' );
	};

	Transition.prototype.registerCompleteHandler = function registerCompleteHandler ( fn ) {
		addToArray( this.onComplete, fn );
	};

	Transition.prototype.render = function render () {};

	Transition.prototype.setStyle = function setStyle ( style, value ) {
		if ( typeof style === 'string' ) {
			this.node.style[ prefix$1( style ) ] = value;
		}

		else {
			var prop;
			for ( prop in style ) {
				if ( style.hasOwnProperty( prop ) ) {
					this.node.style[ prefix$1( prop ) ] = style[ prop ];
				}
			}
		}

		return this;
	};

	Transition.prototype.start = function start () {
		var this$1 = this;

			var node = this.node = this.element.node;
		var originalStyle = node.getAttribute( 'style' );

		var completed;
		var args = this.params;

		// create t.complete() - we don't want this on the prototype,
		// because we don't want `this` silliness when passing it as
		// an argument
		this.complete = function ( noReset ) {
			if ( completed ) {
				return;
			}

			this$1.onComplete.forEach( function ( fn ) { return fn(); } );
			if ( !noReset && this$1.isIntro ) {
				resetStyle( node, originalStyle);
			}

			this$1._manager.remove( this$1 );

			completed = true;
		};

		// If the transition function doesn't exist, abort
		if ( !this._fn ) {
			this.complete();
			return;
		}

		// get expression args if supplied
		if ( this.argsFn ) {
			var values = this.models.map( function ( model ) {
				if ( !model ) return undefined;

				return model.get();
			});
			args = this.argsFn.apply( this.ractive, values );
		}

		var promise = this._fn.apply( this.ractive, [ this ].concat( args ) );
		if ( promise ) promise.then( this.complete );
	};

	Transition.prototype.toString = function toString () { return ''; };

	Transition.prototype.unbind = function unbind$1 () {
		if ( this.resolvers ) this.resolvers.forEach( unbind );
		if ( !this.element.attributes.unbinding ) {
			var type = this.options && this.options.template && this.options.template.v;
			if ( type === 't0' || type === 't1' ) this.element._introTransition = null;
			if ( type === 't0' || type === 't2' ) this.element._outroTransition = null;
		}
	};

	Transition.prototype.unregisterCompleteHandler = function unregisterCompleteHandler ( fn ) {
		removeFromArray( this.onComplete, fn );
	};

	Transition.prototype.unrender = function unrender () {};

	Transition.prototype.update = function update () {};

	var elementCache = {};

	var ieBug;
	var ieBlacklist;

	try {
		createElement( 'table' ).innerHTML = 'foo';
	} catch ( err ) {
		ieBug = true;

		ieBlacklist = {
			TABLE:  [ '<table class="x">', '</table>' ],
			THEAD:  [ '<table><thead class="x">', '</thead></table>' ],
			TBODY:  [ '<table><tbody class="x">', '</tbody></table>' ],
			TR:     [ '<table><tr class="x">', '</tr></table>' ],
			SELECT: [ '<select class="x">', '</select>' ]
		};
	}

	function insertHtml ( html, node, docFrag ) {
		var nodes = [];

		// render 0 and false
		if ( html == null || html === '' ) return nodes;

		var container;
		var wrapper;
		var selectedOption;

		if ( ieBug && ( wrapper = ieBlacklist[ node.tagName ] ) ) {
			container = element( 'DIV' );
			container.innerHTML = wrapper[0] + html + wrapper[1];
			container = container.querySelector( '.x' );

			if ( container.tagName === 'SELECT' ) {
				selectedOption = container.options[ container.selectedIndex ];
			}
		}

		else if ( node.namespaceURI === svg$1 ) {
			container = element( 'DIV' );
			container.innerHTML = '<svg class="x">' + html + '</svg>';
			container = container.querySelector( '.x' );
		}

		else if ( node.tagName === 'TEXTAREA' ) {
			container = createElement( 'div' );

			if ( typeof container.textContent !== 'undefined' ) {
				container.textContent = html;
			} else {
				container.innerHTML = html;
			}
		}

		else {
			container = element( node.tagName );
			container.innerHTML = html;

			if ( container.tagName === 'SELECT' ) {
				selectedOption = container.options[ container.selectedIndex ];
			}
		}

		var child;
		while ( child = container.firstChild ) {
			nodes.push( child );
			docFrag.appendChild( child );
		}

		// This is really annoying. Extracting <option> nodes from the
		// temporary container <select> causes the remaining ones to
		// become selected. So now we have to deselect them. IE8, you
		// amaze me. You really do
		// ...and now Chrome too
		var i;
		if ( node.tagName === 'SELECT' ) {
			i = nodes.length;
			while ( i-- ) {
				if ( nodes[i] !== selectedOption ) {
					nodes[i].selected = false;
				}
			}
		}

		return nodes;
	}

	function element ( tagName ) {
		return elementCache[ tagName ] || ( elementCache[ tagName ] = createElement( tagName ) );
	}

	var Triple = (function (Mustache) {
		function Triple ( options ) {
			Mustache.call( this, options );
		}

		Triple.prototype = Object.create( Mustache && Mustache.prototype );
		Triple.prototype.constructor = Triple;

		Triple.prototype.detach = function detach () {
			var docFrag = createDocumentFragment();
			this.nodes.forEach( function ( node ) { return docFrag.appendChild( node ); } );
			return docFrag;
		};

		Triple.prototype.find = function find ( selector ) {
			var this$1 = this;

			var len = this.nodes.length;
			var i;

			for ( i = 0; i < len; i += 1 ) {
				var node = this$1.nodes[i];

				if ( node.nodeType !== 1 ) continue;

				if ( matches( node, selector ) ) return node;

				var queryResult = node.querySelector( selector );
				if ( queryResult ) return queryResult;
			}

			return null;
		};

		Triple.prototype.findAll = function findAll ( selector, query ) {
			var this$1 = this;

			var len = this.nodes.length;
			var i;

			for ( i = 0; i < len; i += 1 ) {
				var node = this$1.nodes[i];

				if ( node.nodeType !== 1 ) continue;

				if ( query.test( node ) ) query.add( node );

				var queryAllResult = node.querySelectorAll( selector );
				if ( queryAllResult ) {
					var numNodes = queryAllResult.length;
					var j;

					for ( j = 0; j < numNodes; j += 1 ) {
						query.add( queryAllResult[j] );
					}
				}
			}
		};

		Triple.prototype.findComponent = function findComponent () {
			return null;
		};

		Triple.prototype.firstNode = function firstNode () {
			return this.nodes[0];
		};

		Triple.prototype.render = function render ( target ) {
			var html = this.model ? this.model.get() : '';
			this.nodes = insertHtml( html, this.parentFragment.findParentNode(), target );
			this.rendered = true;
		};

		Triple.prototype.toString = function toString () {
			var value = this.model && this.model.get();
			value = value != null ? '' + value : '';

			return inAttribute() ? decodeCharacterReferences( value ) : value;
		};

		Triple.prototype.unrender = function unrender () {
			if ( this.nodes ) this.nodes.forEach( function ( node ) { return detachNode( node ); } );
			this.rendered = false;
		};

		Triple.prototype.update = function update () {
			if ( this.rendered && this.dirty ) {
				this.dirty = false;

				this.unrender();
				var docFrag = createDocumentFragment();
				this.render( docFrag );

				var parentNode = this.parentFragment.findParentNode();
				var anchor = this.parentFragment.findNextNode( this );

				parentNode.insertBefore( docFrag, anchor );
			} else {
				// make sure to reset the dirty flag even if not rendered
				this.dirty = false;
			}
		};

		return Triple;
	}(Mustache));

	var Yielder = (function (Item) {
		function Yielder ( options ) {
			Item.call( this, options );

			this.container = options.parentFragment.ractive;
			this.component = this.container.component;

			this.containerFragment = options.parentFragment;
			this.parentFragment = this.component.parentFragment;

			// {{yield}} is equivalent to {{yield content}}
			this.name = options.template.n || '';
		}

		Yielder.prototype = Object.create( Item && Item.prototype );
		Yielder.prototype.constructor = Yielder;

		Yielder.prototype.bind = function bind () {
			var name = this.name;

			( this.component.yielders[ name ] || ( this.component.yielders[ name ] = [] ) ).push( this );

			// TODO don't parse here
			var template = this.container._inlinePartials[ name || 'content' ];

			if ( typeof template === 'string' ) {
				template = parse( template ).t;
			}

			if ( !template ) {
				warnIfDebug( ("Could not find template for partial \"" + name + "\""), { ractive: this.ractive });
				template = [];
			}

			this.fragment = new Fragment({
				owner: this,
				ractive: this.container.parent,
				template: template
			}).bind();
		};

		Yielder.prototype.bubble = function bubble () {
			if ( !this.dirty ) {
				this.containerFragment.bubble();
				this.dirty = true;
			}
		};

		Yielder.prototype.detach = function detach () {
			return this.fragment.detach();
		};

		Yielder.prototype.find = function find ( selector ) {
			return this.fragment.find( selector );
		};

		Yielder.prototype.findAll = function findAll ( selector, queryResult ) {
			this.fragment.findAll( selector, queryResult );
		};

		Yielder.prototype.findComponent = function findComponent ( name ) {
			return this.fragment.findComponent( name );
		};

		Yielder.prototype.findAllComponents = function findAllComponents ( name, queryResult ) {
			this.fragment.findAllComponents( name, queryResult );
		};

		Yielder.prototype.findNextNode = function findNextNode() {
			return this.containerFragment.findNextNode( this );
		};

		Yielder.prototype.firstNode = function firstNode ( skipParent ) {
			return this.fragment.firstNode( skipParent );
		};

		Yielder.prototype.render = function render ( target, occupants ) {
			return this.fragment.render( target, occupants );
		};

		Yielder.prototype.setTemplate = function setTemplate ( name ) {
			var template = this.parentFragment.ractive.partials[ name ];

			if ( typeof template === 'string' ) {
				template = parse( template ).t;
			}

			this.partialTemplate = template || []; // TODO warn on missing partial
		};

		Yielder.prototype.toString = function toString ( escape ) {
			return this.fragment.toString( escape );
		};

		Yielder.prototype.unbind = function unbind () {
			this.fragment.unbind();
			removeFromArray( this.component.yielders[ this.name ], this );
		};

		Yielder.prototype.unrender = function unrender ( shouldDestroy ) {
			this.fragment.unrender( shouldDestroy );
		};

		Yielder.prototype.update = function update () {
			this.dirty = false;
			this.fragment.update();
		};

		return Yielder;
	}(Item));

	// finds the component constructor in the registry or view hierarchy registries
	function getComponentConstructor ( ractive, name ) {
		var instance = findInstance( 'components', ractive, name );
		var Component;

		if ( instance ) {
			Component = instance.components[ name ];

			// best test we have for not Ractive.extend
			if ( !Component._Parent ) {
				// function option, execute and store for reset
				var fn = Component.bind( instance );
				fn.isOwner = instance.components.hasOwnProperty( name );
				Component = fn();

				if ( !Component ) {
					warnIfDebug( noRegistryFunctionReturn, name, 'component', 'component', { ractive: ractive });
					return;
				}

				if ( typeof Component === 'string' ) {
					// allow string lookup
					Component = getComponentConstructor( ractive, Component );
				}

				Component._fn = fn;
				instance.components[ name ] = Component;
			}
		}

		return Component;
	}

	var constructors = {};
	constructors[ ALIAS ] = Alias;
	constructors[ DOCTYPE ] = Doctype;
	constructors[ INTERPOLATOR ] = Interpolator;
	constructors[ PARTIAL ] = Partial;
	constructors[ SECTION ] = Section;
	constructors[ TRIPLE ] = Triple;
	constructors[ YIELDER ] = Yielder;

	constructors[ ATTRIBUTE ] = Attribute;
	constructors[ BINDING_FLAG ] = BindingFlag;
	constructors[ DECORATOR ] = Decorator;
	constructors[ EVENT ] = EventDirective;
	constructors[ TRANSITION ] = Transition;

	var specialElements = {
		doctype: Doctype,
		form: Form,
		input: Input,
		option: Option,
		select: Select,
		textarea: Textarea
	};

	function createItem ( options ) {
		if ( typeof options.template === 'string' ) {
			return new Text( options );
		}

		if ( options.template.t === ELEMENT ) {
			// could be component or element
			var ComponentConstructor = getComponentConstructor( options.parentFragment.ractive, options.template.e );
			if ( ComponentConstructor ) {
				return new Component( options, ComponentConstructor );
			}

			var tagName = options.template.e.toLowerCase();

			var ElementConstructor = specialElements[ tagName ] || Element;
			return new ElementConstructor( options );
		}

		var Item;

		// component mappings are a special case of attribute
		if ( options.template.t === ATTRIBUTE ) {
			var el = options.owner;
			if ( !el || ( el.type !== COMPONENT && el.type !== ELEMENT ) ) {
				el = findElement( options.parentFragment );
			}
			options.element = el;

			Item = el.type === COMPONENT ? Mapping : Attribute;
		} else {
			Item = constructors[ options.template.t ];
		}

		if ( !Item ) throw new Error( ("Unrecognised item type " + (options.template.t)) );

		return new Item( options );
	}

	// TODO all this code needs to die
	function processItems ( items, values, guid, counter ) {
		if ( counter === void 0 ) counter = 0;

		return items.map( function ( item ) {
			if ( item.type === TEXT ) {
				return item.template;
			}

			if ( item.fragment ) {
				if ( item.fragment.iterations ) {
					return item.fragment.iterations.map( function ( fragment ) {
						return processItems( fragment.items, values, guid, counter );
					}).join( '' );
				} else {
					return processItems( item.fragment.items, values, guid, counter );
				}
			}

			var placeholderId = "" + guid + "-" + (counter++);
			var model = item.model || item.newModel;

			values[ placeholderId ] = model ?
				model.wrapper ?
					model.wrapperValue :
					model.get() :
				undefined;

			return '${' + placeholderId + '}';
		}).join( '' );
	}

	function unrenderAndDestroy$1 ( item ) {
		item.unrender( true );
	}

	var Fragment = function Fragment ( options ) {
		this.owner = options.owner; // The item that owns this fragment - an element, section, partial, or attribute

		this.isRoot = !options.owner.parentFragment;
		this.parent = this.isRoot ? null : this.owner.parentFragment;
		this.ractive = options.ractive || ( this.isRoot ? options.owner : this.parent.ractive );

		this.componentParent = ( this.isRoot && this.ractive.component ) ? this.ractive.component.parentFragment : null;

		this.context = null;
		this.rendered = false;

		// encapsulated styles should be inherited until they get applied by an element
		this.cssIds = 'cssIds' in options ? options.cssIds : ( this.parent ? this.parent.cssIds : null );

		this.resolvers = [];

		this.dirty = false;
		this.dirtyArgs = this.dirtyValue = true; // TODO getArgsList is nonsense - should deprecate legacy directives style

		this.template = options.template || [];
		this.createItems();
	};

	Fragment.prototype.bind = function bind$1$$ ( context ) {
		this.context = context;
		this.items.forEach( bind$1 );
		this.bound = true;

		// in rare cases, a forced resolution (or similar) will cause the
		// fragment to be dirty before it's even finished binding. In those
		// cases we update immediately
		if ( this.dirty ) this.update();

		return this;
	};

	Fragment.prototype.bubble = function bubble () {
		this.dirtyArgs = this.dirtyValue = true;

		if ( !this.dirty ) {
			this.dirty = true;

			if ( this.isRoot ) { // TODO encapsulate 'is component root, but not overall root' check?
				if ( this.ractive.component ) {
					this.ractive.component.bubble();
				} else if ( this.bound ) {
					runloop.addFragment( this );
				}
			} else {
				this.owner.bubble();
			}
		}
	};

	Fragment.prototype.createItems = function createItems () {
		// this is a hot code path
		var this$1 = this;

			var max = this.template.length;
		this.items = [];
		for ( var i = 0; i < max; i++ ) {
			this$1.items[i] = createItem({ parentFragment: this$1, template: this$1.template[i], index: i });
		}
	};

	Fragment.prototype.destroyed = function destroyed () {
		this.items.forEach( function ( i ) { return i.destroyed(); } );
	};

	Fragment.prototype.detach = function detach () {
		var docFrag = createDocumentFragment();
		this.items.forEach( function ( item ) { return docFrag.appendChild( item.detach() ); } );
		return docFrag;
	};

	Fragment.prototype.find = function find ( selector ) {
		var this$1 = this;

			var len = this.items.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			var found = this$1.items[i].find( selector );
			if ( found ) return found;
		}
	};

	Fragment.prototype.findAll = function findAll ( selector, query ) {
		var this$1 = this;

			if ( this.items ) {
			var len = this.items.length;
			var i;

			for ( i = 0; i < len; i += 1 ) {
				var item = this$1.items[i];

				if ( item.findAll ) {
					item.findAll( selector, query );
				}
			}
		}

		return query;
	};

	Fragment.prototype.findComponent = function findComponent ( name ) {
		var this$1 = this;

			var len = this.items.length;
		var i;

		for ( i = 0; i < len; i += 1 ) {
			var found = this$1.items[i].findComponent( name );
			if ( found ) return found;
		}
	};

	Fragment.prototype.findAllComponents = function findAllComponents ( name, query ) {
		var this$1 = this;

			if ( this.items ) {
			var len = this.items.length;
			var i;

			for ( i = 0; i < len; i += 1 ) {
				var item = this$1.items[i];

				if ( item.findAllComponents ) {
					item.findAllComponents( name, query );
				}
			}
		}

		return query;
	};

	Fragment.prototype.findContext = function findContext () {
		var fragment = this;
		while ( fragment && !fragment.context ) fragment = fragment.parent;
		if ( !fragment ) return this.ractive.viewmodel;
		else return fragment.context;
	};

	Fragment.prototype.findNextNode = function findNextNode ( item ) {
		// search for the next node going forward
		var this$1 = this;

			if ( item ) {
			for ( var i = item.index + 1; i < this$1.items.length; i++ ) {
				if ( !this$1.items[ i ] ) continue;

				var node = this$1.items[ i ].firstNode( true );
				if ( node ) return node;
			}
		}

		// if this is the root fragment, and there are no more items,
		// it means we're at the end...
		if ( this.isRoot ) {
			if ( this.ractive.component ) {
				return this.ractive.component.parentFragment.findNextNode( this.ractive.component );
			}

			// TODO possible edge case with other content
			// appended to this.ractive.el?
			return null;
		}

		if ( this.parent ) return this.owner.findNextNode( this ); // the argument is in case the parent is a RepeatedFragment
	};

	Fragment.prototype.findParentNode = function findParentNode () {
		var fragment = this;

		do {
			if ( fragment.owner.type === ELEMENT ) {
				return fragment.owner.node;
			}

			if ( fragment.isRoot && !fragment.ractive.component ) { // TODO encapsulate check
				return fragment.ractive.el;
			}

			if ( fragment.owner.type === YIELDER ) {
				fragment = fragment.owner.containerFragment;
			} else {
				fragment = fragment.componentParent || fragment.parent; // TODO ugh
			}
		} while ( fragment );

		throw new Error( 'Could not find parent node' ); // TODO link to issue tracker
	};

	Fragment.prototype.findRepeatingFragment = function findRepeatingFragment () {
		var fragment = this;
		// TODO better check than fragment.parent.iterations
		while ( ( fragment.parent || fragment.componentParent ) && !fragment.isIteration ) {
			fragment = fragment.parent || fragment.componentParent;
		}

		return fragment;
	};

	Fragment.prototype.firstNode = function firstNode ( skipParent ) {
		var this$1 = this;

			var node;
		for ( var i = 0; i < this$1.items.length; i++ ) {
			node = this$1.items[i].firstNode( true );

			if ( node ) {
				return node;
			}
		}

		if ( skipParent ) return null;

		return this.parent.findNextNode( this.owner );
	};

	// TODO ideally, this would be deprecated in favour of an
	// expression-like approach
	Fragment.prototype.getArgsList = function getArgsList () {
		if ( this.dirtyArgs ) {
			var values = {};
			var source = processItems( this.items, values, this.ractive._guid );
			var parsed = parseJSON( '[' + source + ']', values );

			this.argsList = parsed ?
				parsed.value :
				[ this.toString() ];

			this.dirtyArgs = false;
		}

		return this.argsList;
	};

	Fragment.prototype.rebinding = function rebinding ( next ) {
		this.context = next;
	};

	Fragment.prototype.render = function render ( target, occupants ) {
		if ( this.rendered ) throw new Error( 'Fragment is already rendered!' );
		this.rendered = true;

		this.items.forEach( function ( item ) { return item.render( target, occupants ); } );
	};

	Fragment.prototype.resetTemplate = function resetTemplate ( template ) {
		var wasBound = this.bound;
		var wasRendered = this.rendered;

		// TODO ensure transitions are disabled globally during reset

		if ( wasBound ) {
			if ( wasRendered ) this.unrender( true );
			this.unbind();
		}

		this.template = template;
		this.createItems();

		if ( wasBound ) {
			this.bind( this.context );

			if ( wasRendered ) {
				var parentNode = this.findParentNode();
				var anchor = this.findNextNode();

				if ( anchor ) {
					var docFrag = createDocumentFragment();
					this.render( docFrag );
					parentNode.insertBefore( docFrag, anchor );
				} else {
					this.render( parentNode );
				}
			}
		}
	};

	Fragment.prototype.resolve = function resolve ( template, callback ) {
		if ( !this.context && this.parent.resolve ) {
			return this.parent.resolve( template, callback );
		}

		var resolver = new ReferenceResolver( this, template, callback );
		this.resolvers.push( resolver );

		return resolver; // so we can e.g. force resolution
	};

	Fragment.prototype.shuffled = function shuffled () {
		this.items.forEach( function ( i ) { return i.shuffled(); } );
	};

	Fragment.prototype.toHtml = function toHtml () {
		return this.toString();
	};

	Fragment.prototype.toString = function toString$1$$ ( escape ) {
		return this.items.map( escape ? toEscapedString : toString$1 ).join( '' );
	};

	Fragment.prototype.unbind = function unbind$1 () {
		this.items.forEach( unbind );
		this.bound = false;

		return this;
	};

	Fragment.prototype.unrender = function unrender$1 ( shouldDestroy ) {
		this.items.forEach( shouldDestroy ? unrenderAndDestroy$1 : unrender );
		this.rendered = false;
	};

	Fragment.prototype.update = function update$1 () {
		if ( this.dirty ) {
			if ( !this.updating ) {
				this.dirty = false;
				this.updating = true;
				this.items.forEach( update );
				this.updating = false;
			} else if ( this.isRoot ) {
				runloop.addFragmentToRoot( this );
			}
		}
	};

	Fragment.prototype.valueOf = function valueOf () {
		if ( this.items.length === 1 ) {
			return this.items[0].valueOf();
		}

		if ( this.dirtyValue ) {
			var values = {};
			var source = processItems( this.items, values, this.ractive._guid );
			var parsed = parseJSON( source, values );

			this.value = parsed ?
				parsed.value :
				this.toString();

			this.dirtyValue = false;
		}

		return this.value;
	};

	// TODO should resetTemplate be asynchronous? i.e. should it be a case
	// of outro, update template, intro? I reckon probably not, since that
	// could be achieved with unrender-resetTemplate-render. Also, it should
	// conceptually be similar to resetPartial, which couldn't be async

	function Ractive$resetTemplate ( template ) {
		templateConfigurator.init( null, this, { template: template });

		var transitionsEnabled = this.transitionsEnabled;
		this.transitionsEnabled = false;

		// Is this is a component, we need to set the `shouldDestroy`
		// flag, otherwise it will assume by default that a parent node
		// will be detached, and therefore it doesn't need to bother
		// detaching its own nodes
		var component = this.component;
		if ( component ) component.shouldDestroy = true;
		this.unrender();
		if ( component ) component.shouldDestroy = false;

		// remove existing fragment and create new one
		this.fragment.unbind().unrender( true );

		this.fragment = new Fragment({
			template: this.template,
			root: this,
			owner: this
		});

		var docFrag = createDocumentFragment();
		this.fragment.bind( this.viewmodel ).render( docFrag );

		// if this is a component, its el may not be valid, so find a
		// target based on the component container
		if ( component ) {
			this.fragment.findParentNode().insertBefore( docFrag, component.findNextNode() );
		} else {
			this.el.insertBefore( docFrag, this.anchor );
		}

		this.transitionsEnabled = transitionsEnabled;
	}

	var reverse$1 = makeArrayMethod( 'reverse' ).path;

	function Ractive$set ( keypath, value ) {
		var ractive = this;

		return set( ractive, build( ractive, keypath, value ) );
	}

	var shift$1 = makeArrayMethod( 'shift' ).path;

	var sort$1 = makeArrayMethod( 'sort' ).path;

	var splice$1 = makeArrayMethod( 'splice' ).path;

	function Ractive$subtract ( keypath, d ) {
		return add( this, keypath, ( d === undefined ? -1 : -d ) );
	}

	var teardownHook$1 = new Hook( 'teardown' );

	// Teardown. This goes through the root fragment and all its children, removing observers
	// and generally cleaning up after itself

	function Ractive$teardown () {
		if ( this.torndown ) {
			warnIfDebug( 'ractive.teardown() was called on a Ractive instance that was already torn down' );
			return Promise$1.resolve();
		}

		this.torndown = true;
		this.fragment.unbind();
		this.viewmodel.teardown();

		this._observers.forEach( cancel );

		if ( this.fragment.rendered && this.el.__ractive_instances__ ) {
			removeFromArray( this.el.__ractive_instances__, this );
		}

		this.shouldDestroy = true;
		var promise = ( this.fragment.rendered ? this.unrender() : Promise$1.resolve() );

		teardownHook$1.fire( this );

		return promise;
	}

	function Ractive$toggle ( keypath ) {
		if ( typeof keypath !== 'string' ) {
			throw new TypeError( badArguments );
		}

		return set( this, gather( this, keypath ).map( function ( m ) { return [ m, !m.get() ]; } ) );
	}

	function Ractive$toCSS() {
		var cssIds = [ this.cssId ].concat( this.findAllComponents().map( function ( c ) { return c.cssId; } ) );
		var uniqueCssIds = Object.keys(cssIds.reduce( function ( ids, id ) { return (ids[id] = true, ids); }, {}));
		return getCSS( uniqueCssIds );
	}

	function Ractive$toHTML () {
		return this.fragment.toString( true );
	}

	function toText () {
		return this.fragment.toString( false );
	}

	function Ractive$transition ( name, node, params ) {

		if ( node instanceof HTMLElement ) {
			// good to go
		}
		else if ( isObject( node ) ) {
			// omitted, use event node
			params = node;
		}

		// if we allow query selector, then it won't work
		// simple params like "fast"

		// else if ( typeof node === 'string' ) {
		// 	// query selector
		// 	node = this.find( node )
		// }

		node = node || this.event.node;

		if ( !node || !node._ractive ) {
			fatal( ("No node was supplied for transition " + name) );
		}

		params = params || {};
		var owner = node._ractive.proxy;
		var transition = new Transition({ owner: owner, parentFragment: owner.parentFragment, name: name, params: params });
		transition.bind();

		var promise = runloop.start( this, true );
		runloop.registerTransition( transition );
		runloop.end();

		promise.then( function () { return transition.unbind(); } );
		return promise;
	}

	function unlink$1( here ) {
		var promise = runloop.start();
		this.viewmodel.joinAll( splitKeypathI( here ), { lastLink: false } ).unlink();
		runloop.end();
		return promise;
	}

	var unrenderHook$1 = new Hook( 'unrender' );

	function Ractive$unrender () {
		if ( !this.fragment.rendered ) {
			warnIfDebug( 'ractive.unrender() was called on a Ractive instance that was not rendered' );
			return Promise$1.resolve();
		}

		var promise = runloop.start( this, true );

		// If this is a component, and the component isn't marked for destruction,
		// don't detach nodes from the DOM unnecessarily
		var shouldDestroy = !this.component || this.component.shouldDestroy || this.shouldDestroy;
		this.fragment.unrender( shouldDestroy );

		removeFromArray( this.el.__ractive_instances__, this );

		unrenderHook$1.fire( this );

		runloop.end();
		return promise;
	}

	var unshift$1 = makeArrayMethod( 'unshift' ).path;

	function Ractive$updateModel ( keypath, cascade ) {
		var promise = runloop.start( this, true );

		if ( !keypath ) {
			this.viewmodel.updateFromBindings( true );
		} else {
			this.viewmodel.joinAll( splitKeypathI( keypath ) ).updateFromBindings( cascade !== false );
		}

		runloop.end();

		return promise;
	}

	var proto = {
		add: Ractive$add,
		animate: Ractive$animate,
		detach: Ractive$detach,
		find: Ractive$find,
		findAll: Ractive$findAll,
		findAllComponents: Ractive$findAllComponents,
		findComponent: Ractive$findComponent,
		findContainer: Ractive$findContainer,
		findParent: Ractive$findParent,
		fire: Ractive$fire,
		get: Ractive$get,
		getNodeInfo: getNodeInfo,
		insert: Ractive$insert,
		link: link$1,
		merge: thisRactive$merge,
		observe: observe,
		observeList: observeList,
		observeOnce: observeOnce,
		// TODO reinstate these
		// observeListOnce,
		off: Ractive$off,
		on: Ractive$on,
		once: Ractive$once,
		pop: pop$1,
		push: push$1,
		render: Ractive$render,
		reset: Ractive$reset,
		resetPartial: resetPartial,
		resetTemplate: Ractive$resetTemplate,
		reverse: reverse$1,
		set: Ractive$set,
		shift: shift$1,
		sort: sort$1,
		splice: splice$1,
		subtract: Ractive$subtract,
		teardown: Ractive$teardown,
		toggle: Ractive$toggle,
		toCSS: Ractive$toCSS,
		toCss: Ractive$toCSS,
		toHTML: Ractive$toHTML,
		toHtml: Ractive$toHTML,
		toText: toText,
		transition: Ractive$transition,
		unlink: unlink$1,
		unrender: Ractive$unrender,
		unshift: unshift$1,
		update: Ractive$update,
		updateModel: Ractive$updateModel
	};

	function wrap$1 ( method, superMethod, force ) {

		if ( force || needsSuper( method, superMethod ) )  {

			return function () {

				var hasSuper = ( '_super' in this ), _super = this._super, result;

				this._super = superMethod;

				result = method.apply( this, arguments );

				if ( hasSuper ) {
					this._super = _super;
				}

				return result;
			};
		}

		else {
			return method;
		}
	}

	function needsSuper ( method, superMethod ) {
		return typeof superMethod === 'function' && /_super/.test( method );
	}

	function unwrap ( Child ) {
		var options = {};

		while ( Child ) {
			addRegistries( Child, options );
			addOtherOptions( Child, options );

			if ( Child._Parent !== Ractive ) {
				Child = Child._Parent;
			} else {
				Child = false;
			}
		}

		return options;
	}

	function addRegistries ( Child, options ) {
		registries.forEach( function ( r ) {
			addRegistry(
				r.useDefaults ? Child.prototype : Child,
				options, r.name );
		});
	}

	function addRegistry ( target, options, name ) {
		var registry, keys = Object.keys( target[ name ] );

		if ( !keys.length ) { return; }

		if ( !( registry = options[ name ] ) ) {
			registry = options[ name ] = {};
		}

		keys
			.filter( function ( key ) { return !( key in registry ); } )
			.forEach( function ( key ) { return registry[ key ] = target[ name ][ key ]; } );
	}

	function addOtherOptions ( Child, options ) {
		Object.keys( Child.prototype ).forEach( function ( key ) {
			if ( key === 'computed' ) { return; }

			var value = Child.prototype[ key ];

			if ( !( key in options ) ) {
				options[ key ] = value._method ? value._method : value;
			}

			// is it a wrapped function?
			else if ( typeof options[ key ] === 'function'
					&& typeof value === 'function'
					&& options[ key ]._method ) {

				var result, needsSuper = value._method;

				if ( needsSuper ) { value = value._method; }

				// rewrap bound directly to parent fn
				result = wrap$1( options[ key ]._method, value );

				if ( needsSuper ) { result._method = result; }

				options[ key ] = result;
			}
		});
	}

	function extend () {
		var options = [], len = arguments.length;
		while ( len-- ) options[ len ] = arguments[ len ];

		if( !options.length ) {
			return extendOne( this );
		} else {
			return options.reduce( extendOne, this );
		}
	}

	function extendOne ( Parent, options ) {
		if ( options === void 0 ) options = {};

		var Child, proto;

		// if we're extending with another Ractive instance...
		//
		//   var Human = Ractive.extend(...), Spider = Ractive.extend(...);
		//   var Spiderman = Human.extend( Spider );
		//
		// ...inherit prototype methods and default options as well
		if ( options.prototype instanceof Ractive ) {
			options = unwrap( options );
		}

		Child = function ( options ) {
			if ( !( this instanceof Child ) ) return new Child( options );

			construct( this, options || {} );
			initialise( this, options || {}, {} );
		};

		proto = create( Parent.prototype );
		proto.constructor = Child;

		// Static properties
		defineProperties( Child, {
			// alias prototype as defaults
			defaults: { value: proto },

			// extendable
			extend: { value: extend, writable: true, configurable: true },

			// Parent - for IE8, can't use Object.getPrototypeOf
			_Parent: { value: Parent }
		});

		// extend configuration
		config.extend( Parent, proto, options );

		dataConfigurator.extend( Parent, proto, options );

		if ( options.computed ) {
			proto.computed = extendObj( create( Parent.prototype.computed ), options.computed );
		}

		Child.prototype = proto;

		return Child;
	}

	function joinKeys () {
		var keys = [], len = arguments.length;
		while ( len-- ) keys[ len ] = arguments[ len ];

		return keys.map( escapeKey ).join( '.' );
	}

	function splitKeypath ( keypath ) {
		return splitKeypathI( keypath ).map( unescapeKey );
	}

	// Ractive.js makes liberal use of things like Array.prototype.indexOf. In
	// older browsers, these are made available via a shim - here, we do a quick
	// pre-flight check to make sure that either a) we're not in a shit browser,
	// or b) we're using a Ractive-legacy.js build
	var FUNCTION = 'function';

	if (
		typeof Date.now !== FUNCTION                 ||
		typeof String.prototype.trim !== FUNCTION    ||
		typeof Object.keys !== FUNCTION              ||
		typeof Array.prototype.indexOf !== FUNCTION  ||
		typeof Array.prototype.forEach !== FUNCTION  ||
		typeof Array.prototype.map !== FUNCTION      ||
		typeof Array.prototype.filter !== FUNCTION   ||
		( win && typeof win.addEventListener !== FUNCTION )
	) {
		throw new Error( 'It looks like you\'re attempting to use Ractive.js in an older browser. You\'ll need to use one of the \'legacy builds\' in order to continue - see http://docs.ractivejs.org/latest/legacy-builds for more information.' );
	}

	function Ractive ( options ) {
		if ( !( this instanceof Ractive ) ) return new Ractive( options );

		construct( this, options || {} );
		initialise( this, options || {}, {} );
	}

	extendObj( Ractive.prototype, proto, defaults );
	Ractive.prototype.constructor = Ractive;

	// alias prototype as `defaults`
	Ractive.defaults = Ractive.prototype;

	// static properties
	defineProperties( Ractive, {

		// debug flag
		DEBUG:          { writable: true, value: true },
		DEBUG_PROMISES: { writable: true, value: true },

		// static methods:
		extend:         { value: extend },
		escapeKey:      { value: escapeKey },
		getNodeInfo:    { value: staticInfo },
		joinKeys:       { value: joinKeys },
		parse:          { value: parse },
		splitKeypath:   { value: splitKeypath },
		unescapeKey:    { value: unescapeKey },
		getCSS:         { value: getCSS },

		// namespaced constructors
		Promise:        { value: Promise$1 },

		// support
		enhance:        { writable: true, value: false },
		svg:            { value: svg },
		magic:          { value: magicSupported },

		// version
		VERSION:        { value: '0.8.11' },

		// plugins
		adaptors:       { writable: true, value: {} },
		components:     { writable: true, value: {} },
		decorators:     { writable: true, value: {} },
		easing:         { writable: true, value: easing },
		events:         { writable: true, value: {} },
		interpolators:  { writable: true, value: interpolators },
		partials:       { writable: true, value: {} },
		transitions:    { writable: true, value: {} }
	});

	return Ractive;

}));
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){

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

},{}],9:[function(require,module,exports){
module.exports = "{{#each paragraphs as paragraph}}\n\t<p>\n\t\t{{#each paragraph as chunk}}\n\t\t\t{{#if type === 'verse'}}\n\t\t\t\t<span\n\t\t\t\tdata-chapter-number=\"{{chapterNumber}}\"\n\t\t\t\tdata-verse-number=\"{{verseNumber}}\"\n\t\t\t\tdata-section-number=\"{{sectionNumber}}\"\n\t\t\t\t>\n\t\t\t\t\t{{text}}\n\t\t\t\t</span>\n\t\t\t{{/if}}\n\t\t{{/each}}\n\t</p>\n{{/each}}\n";

},{}],10:[function(require,module,exports){
module.exports = "<div data-chiasm-selected=\"{{!!currentChiasm}}\">\n\t{{#each structuredText as outerChiasm}}\n\t\t<div\n\t\t\tclass=\"chiasm-section\"\n\t\t\tdata-is-selected=\"{{currentChiasm && currentChiasm === identifier}}\"\n\t\t>\n\t\t\t<div\n\t\t\t\tclass=\"chiasm-color-bar\"\n\t\t\t\tstyle=\"background-color: {{getChiasmColor(identifier)}}\"\n\t\t\t\ton-click=\"@this.setChiasm(identifier)\"\n\t\t\t>\n\t\t\t</div>\n\t\t\t<div class=\"chiasm-text\">\n\t\t\t\t<Paragraphs verses=\"{{outerChiasm.verses}}\" />\n\t\t\t</div>\n\t\t</div>\n\t{{/each}}\n</div>\n";

},{}],11:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var identifiers = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

module.exports = [{
	identifier: 'A',
	title: 'Prologue',
	description: 'How to Read This Book',
	range: r([1, 1], [1, 11])
}, {
	identifier: 'B',
	title: 'First Septet – Seven Churches',
	description: 'A Look at the Beginnings of the Church that Christ is Building',
	range: r([1, 12], [3, 22]),
	introduction: {
		title: 'Introduction to the seven churches – Christ is present with His church',
		range: r([1, 12], [1, 20])
	},
	subsections: makeSubsections(s('Ephesus', r([2, 1], [2, 7])), s('Smyrna', r([2, 8], [2, 11])), s('Pergamos', r([2, 12], [2, 17])), s('Thyatira', r([2, 18], [2, 29])), s('Sardis', r([3, 1], [3, 6])), s('Philadelphia', r([3, 7], [3, 13])), s('Laodicea', r([3, 14], [3, 22])))
}, {
	identifier: 'C',
	title: 'Second Septet – Seven Seals',
	description: 'Legal Judgments to be Executed Against Church’s Persecutors',
	range: r([4, 1], [8, 1]),
	introduction: {
		title: 'Introduction to the seven seals – Christ is on His throne and is governing all of history',
		range: r([4, 1], [5, 14])
	},
	subsections: [s('Seal 1 - the white horse', r([6, 1], [6, 2]), 'a'), s('Seal 2 - the red horse', r([6, 3], [6, 4]), 'b'), s('Seal 3 - the black horse', r([6, 5], [6, 6]), 'c'), s('Seal 4 - the yellowish-green horse', r([6, 7], [6, 8]), 'd'), s('Seal 5 - the souls under the altar', r([6, 9], [6, 11]), 'e'), s('Seal 6 - the earthquake', r([6, 12], [6, 17]), 'f'), s('Interlude before the 7th seal: the 144,000 of the Jewish remnant and the innumerable multitude', r([7, 1], [7, 17])), s('Seal 7 - introduces the seven trumpets and seems to comprise all of the third septet', r([8, 1], [8, 1]), 'g')]
}, {
	identifier: 'D',
	title: 'Third Septet – Seven Trumpets',
	description: 'The War Against the Church’s Persecutors',
	range: r([8, 2], [11, 19]),
	introduction: {
		title: 'Introduction to the seven trumpets – God ordains victory for the church through prayer',
		range: r([8, 2], [8, 6])
	},
	subsections: [s('Trumpet 1 - The land is set on fire', r([8, 7], [8, 7]), 'a'), s('Trumpet 2 - The sea is turned to blood', r([8, 8], [8, 9]), 'b'), s('Trumpet 3 - The rivers and springs become bitter', r([8, 10], [8, 12]), 'c'), s('Trumpet 4 - The heavenly bodies are dimmed', r([8, 12], [8, 13]), 'd'), s('Trumpet 5 - Demons released from the pit', r([9, 1], [9, 12]), 'e'), s('Trumpet 6 - Demons released from Euphrates', r([9, 13], [9, 21]), 'f'), s('Interlude before 7th trumpet: The closing off of prophecy & the nature of prophecy', r([10, 1], [11, 14])), s('Trumpet 7 - The seventh trumpet seems to comprise all of the fourth septet', r([11, 15], [11, 19]), 'g')]
}, {
	identifier: 'E',
	title: 'Fourth Septet – Seven Visions',
	description: 'From Total Defeat to Victory',
	range: r([12, 1], [15, 4]),
	introduction: {
		title: 'Introduction to the seven visions – The invisible battles are the key to the earthly ones',
		range: r([12, 1], [12, 17]),
		subsections: [s('The Bride reflecting the glory of her husband', r([12, 1], [12, 1]), 'Ea'), s('The Child of the woman', r([12, 2], [12, 2]), 'Eb'), s('The Dragon tries to devour the Child', r([12, 3], [12, 5]), 'Ec'), s('The woman flees to the wilderness', r([12, 6], [12, 6]), 'Ed'), s('Dragon war in heaven', r([12, 7], [12, 9]), 'Ee'), s('Victory of Christ & His people over the dragon', r([12, 10], [12, 11]), 'Ef'), s('Dragon war on earth', r([12, 12], [12, 13]), 'Ee'), s('The woman flees to the wilderness', r([12, 14], [12, 14]), 'Ed'), s('The Dragon\'s mouth & the earth swallows the serpents flood', r([12, 15], [12, 16]), 'Ec'), s('The rest of the offspring of the woman', r([12, 17, 0], [12, 17, 0]), 'Eb'), s('The church reflecting the word of Christ', r([12, 17, 1], [12, 17]), 'Ea')]
	},
	subsections: [s('The beast rising out of the sea', r([13, 1], [13, 10])), s('The beast rising out of the land', r([13, 11], [13, 18])), s('The 144,000 virgin (warriors) and the Lamb', r([14, 1], [14, 5])), s('The seven angels', r([14, 6], [14, 13])), s('The positive reaping of wheat', r([14, 14], [14, 16])), s('The negative reaping of grapes', r([14, 17], [14, 20])), s('The final "sign in heaven" seems to comprise everything in the fifth septet and guarantees the eventual conversion of all nations (15:1-4)', r([15, 1], [15, 1]))]
}, {
	identifier: 'D',
	title: 'Fifth Septet – Seven Bowls of Wrath Containing the Seven Plagues',
	range: r([15, 2], [16, 17]),
	introduction: {
		title: 'Introduction to the seven plagues – angels preparing for warfare; temple filled with God’s glory',
		range: r([15, 2], [16, 1])
	},
	subsections: makeSubsections(s('Bowl 1 - On the land', r([16, 2], [16, 2])), s('Bowl 2 - On the sea', r([16, 3], [16, 3])), s('Bowl 3 - On the waters', r([16, 4], [16, 7])), s('Bowl 4 - On the sun', r([16, 8], [16, 9])), s('Bowl 5 - On the throne of the beast', r([16, 10], [16, 11])), s('Bowl 6 - On the Euphrates', r([16, 12], [16, 16])), s('Bowl 7 - On the air – note that this 7th bowl seems to introduce all of the next septet (cf. 16:17-21)', r([16, 17], [16, 17])))
}, {
	identifier: 'C',
	title: 'Sixth Septet – Seven Condemnations of Babylon',
	range: r([16, 17], [19, 10]),
	introduction: {
		title: 'Introduction to the seven condemnations – Even with Roman support, Jerusalem is no match for Christ',
		range: r([16, 17], [16, 21])
	},
	subsections: makeSubsections(s('Blasphemy of the Harlot', r([17, 1], [17, 6])), s('Harlots Pagan Alliance with Rome', r([17, 7], [17, 18])), s('Spiritual fornications', r([18, 1], [18, 8])), s('Ungodly statist/commercial alliance', r([18, 9], [18, 20])), s('The finality of Babylon’s fall', r([18, 21], [18, 24])), s('All heaven agreeing with her judgment', r([19, 1], [19, 4])), s('The death of the harlot is followed by the marriage of the Lamb', r([19, 5], [19, 10])))
}, {
	identifier: 'B',
	title: 'Seventh Septet – Seven visions of the victory of Christ’s Kingdom – The Church Militant & Triumphant',
	range: r([19, 11], [22, 17]),
	introduction: {
		title: 'Introduction to the seven New Covenant visions – Jesus proves that He is King of kings and Lord of lords',
		range: r([19, 11], [19, 21])
	},
	subsections: makeSubsections(s('Satan’s power bound', r([20, 1], [20, 3])), s('Victory over death guaranteed – reign in life and in death', r([20, 4], [20, 6])), s('Final judgment', r([20, 11], [20, 15])), s('All things made new', r([21, 1], [21, 8])), s('The New Jerusalem as the spotless bride', r([21, 9], [21, 27])), s('The river of life', r([22, 1], [22, 5])), s('Reiteration that Christ will come soon to finish the old and to continue the renewal of all things', r([22, 6], [22, 17])))
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
	return [guaranteeRangeSection(rangeStart, 0), guaranteeRangeSection(randeEnd, 9999)];
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

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var oneToManyZip = require('one-to-many-array-zip');
var withinRange = require('multi-part-range-compare');

var structure = require('./structure');

module.exports = function addVersesToStructure(verses) {
	return oneToManyZip(structure, verses, function (_ref, verse) {
		var range = _ref.range;

		var _range = _slicedToArray(range, 2),
		    rangeStart = _range[0],
		    rangeEnd = _range[1];

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

},{"./structure":11,"multi-part-range-compare":2,"one-to-many-array-zip":3}]},{},[1]);
