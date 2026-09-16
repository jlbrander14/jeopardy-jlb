// Edit this file to customize your game. Structure:
//   round1 / round2: { name, categories: [ { name, clues: [ {value, clue, answer, dailyDouble} x5 ] } x6 ] }
//   final: { category, clue, answer }
window.JEOPARDY_DATA = {
  round1: {
    name: "Jeopardy Round",
    categories: [
      {
        name: "WORLD CAPITALS",
        clues: [
          { value: 200, clue: "This city on the Seine is the capital of France.", answer: "What is Paris?" },
          { value: 400, clue: "The capital of Japan, it was once called Edo.", answer: "What is Tokyo?" },
          { value: 600, clue: "This African nation's capital, Cairo, sits along this famous river.", answer: "What is the Nile?" },
          { value: 800, clue: "Canberra, not Sydney, is the capital of this country.", answer: "What is Australia?" },
          { value: 1000, clue: "This South American capital sits at over 11,900 feet, one of the highest in the world.", answer: "What is La Paz, Bolivia?" }
        ]
      },
      {
        name: "SCIENCE BASICS",
        clues: [
          { value: 200, clue: "This is the chemical symbol for gold.", answer: "What is Au?" },
          { value: 400, clue: "This force pulls objects toward the center of the Earth.", answer: "What is gravity?" },
          { value: 600, clue: "The powerhouse of the cell, this organelle produces ATP.", answer: "What is the mitochondria?" },
          { value: 800, clue: "This planet is the only one in our solar system known to rotate on its side.", answer: "What is Uranus?" },
          { value: 1000, clue: "This scientist's theory of relativity introduced E=mc^2.", answer: "Who is Albert Einstein?" }
        ]
      },
      {
        name: "MOVIE QUOTES",
        clues: [
          { value: 200, clue: "\"May the Force be with you\" comes from this space saga.", answer: "What is Star Wars?" },
          { value: 400, clue: "\"I'll be back\" was said by this cyborg character.", answer: "What is the Terminator?" },
          {
            value: 600,
            clue: "\"Here's looking at you, kid\" was said by Humphrey Bogart in this 1942 classic.",
            answer: "What is Casablanca?",
            dailyDouble: true
          },
          { value: 800, clue: "\"You can't handle the truth!\" is shouted in this Tom Cruise/Jack Nicholson courtroom drama.", answer: "What is A Few Good Men?" },
          { value: 1000, clue: "\"Why so serious?\" is a signature line from this Batman villain.", answer: "Who is the Joker?" }
        ]
      },
      {
        name: "80s MUSIC",
        clues: [
          { value: 200, clue: "This King of Pop released \"Thriller\" in 1982.", answer: "Who is Michael Jackson?" },
          { value: 400, clue: "This British-Australian bee-themed group popularized disco into the early 80s.", answer: "Who are the Bee Gees?" },
          { value: 600, clue: "Madonna's 1984 hit about a material girl was, appropriately, called this.", answer: "What is \"Material Girl\"?" },
          { value: 800, clue: "This band asked \"Should I Stay or Should I Go\" in 1982.", answer: "Who are the Clash?" },
          { value: 1000, clue: "This a-ha song famously features a comic-book-style music video and the lyric \"Take on me.\"", answer: "What is \"Take On Me\"?" }
        ]
      },
      {
        name: "FOOD & DRINK",
        clues: [
          { value: 200, clue: "This Italian dish is a flatbread typically topped with tomato sauce and cheese.", answer: "What is pizza?" },
          { value: 400, clue: "This fermented soybean paste is a staple of Japanese cooking, often used in soup.", answer: "What is miso?" },
          { value: 600, clue: "This spirit is distilled from the blue agave plant, mainly around Jalisco, Mexico.", answer: "What is tequila?" },
          { value: 800, clue: "This French cooking technique means to cook food quickly in a small amount of fat.", answer: "What is sauté?" },
          { value: 1000, clue: "This pungent fungus, hunted with pigs or dogs, can sell for thousands of dollars per pound.", answer: "What is the truffle?" }
        ]
      },
      {
        name: "U.S. HISTORY",
        clues: [
          { value: 200, clue: "This document, signed in 1776, declared the colonies' independence from Britain.", answer: "What is the Declaration of Independence?" },
          { value: 400, clue: "This Civil War president delivered the Gettysburg Address.", answer: "Who is Abraham Lincoln?" },
          { value: 600, clue: "This 1969 mission landed the first humans on the Moon.", answer: "What is Apollo 11?" },
          { value: 800, clue: "This economic disaster began with the stock market crash of October 1929.", answer: "What is the Great Depression?" },
          { value: 1000, clue: "This amendment, ratified in 1920, gave women the right to vote.", answer: "What is the 19th Amendment?" }
        ]
      }
    ]
  },
  round2: {
    name: "Double Jeopardy Round",
    categories: [
      {
        name: "GEOGRAPHY",
        clues: [
          { value: 400, clue: "This is the longest river in the world.", answer: "What is the Nile?" },
          { value: 800, clue: "This mountain range separates Europe from Asia, running through Russia.", answer: "What are the Urals?" },
          { value: 1200, clue: "This is the smallest country in the world by both area and population.", answer: "What is Vatican City?" },
          { value: 1600, clue: "This desert, the largest hot desert in the world, spans much of North Africa.", answer: "What is the Sahara?" },
          { value: 2000, clue: "This strait separates Asia from North America at its narrowest point.", answer: "What is the Bering Strait?" }
        ]
      },
      {
        name: "TECH & COMPUTING",
        clues: [
          { value: 400, clue: "This company's logo is a bitten fruit.", answer: "What is Apple?" },
          {
            value: 800,
            clue: "This programming language, created by Guido van Rossum, is named after a British comedy troupe.",
            answer: "What is Python?",
            dailyDouble: true
          },
          { value: 1200, clue: "This term describes storing and accessing data over the internet instead of a local hard drive.", answer: "What is the cloud?" },
          { value: 1600, clue: "This protocol, invented by Tim Berners-Lee, underlies data communication for the Web.", answer: "What is HTTP?" },
          { value: 2000, clue: "This basic unit of information in computing is either a 0 or a 1.", answer: "What is a bit?" }
        ]
      },
      {
        name: "CLASSIC LITERATURE",
        clues: [
          { value: 400, clue: "This Jane Austen novel begins, \"It is a truth universally acknowledged...\"", answer: "What is Pride and Prejudice?" },
          { value: 800, clue: "This Herman Melville novel follows Captain Ahab's hunt for a white whale.", answer: "What is Moby-Dick?" },
          { value: 1200, clue: "This dystopian George Orwell novel introduced the phrase \"Big Brother is watching.\"", answer: "What is 1984?" },
          { value: 1600, clue: "This Harper Lee novel is narrated by a young girl named Scout Finch.", answer: "What is To Kill a Mockingbird?" },
          { value: 2000, clue: "This epic poem by Homer follows Odysseus's long journey home after the Trojan War.", answer: "What is the Odyssey?" }
        ]
      },
      {
        name: "SPORTS",
        clues: [
          { value: 400, clue: "This sport is played at Wimbledon.", answer: "What is tennis?" },
          { value: 800, clue: "This country has won the most FIFA World Cup titles.", answer: "What is Brazil?" },
          { value: 1200, clue: "This NBA player is nicknamed \"King James.\"", answer: "Who is LeBron James?" },
          { value: 1600, clue: "This event, first held in 776 BC in Greece, revived in 1896 in Athens.", answer: "What are the Olympic Games?" },
          { value: 2000, clue: "This boxer famously said, \"Float like a butterfly, sting like a bee.\"", answer: "Who is Muhammad Ali?" }
        ]
      },
      {
        name: "TV SITCOMS",
        clues: [
          { value: 400, clue: "This NBC sitcom was set in a coffee shop called Central Perk.", answer: "What is Friends?" },
          { value: 800, clue: "This mockumentary-style sitcom is set at Dunder Mifflin Paper Company.", answer: "What is The Office?" },
          {
            value: 1200,
            clue: "This sitcom about \"four single friends living in Manhattan\" starred Sarah Jessica Parker.",
            answer: "What is Sex and the City?"
          },
          { value: 1600, clue: "This animated sitcom follows the Simpson family in the town of Springfield.", answer: "What is The Simpsons?" },
          {
            value: 2000,
            clue: "This sitcom's theme song ends with \"I'll be there for you,\" performed by The Rembrandts.",
            answer: "What is Friends?",
            dailyDouble: true
          }
        ]
      },
      {
        name: "MYTHOLOGY",
        clues: [
          { value: 400, clue: "This Greek god of the sea carries a trident.", answer: "Who is Poseidon?" },
          { value: 800, clue: "This Norse god of thunder wields a hammer called Mjolnir.", answer: "Who is Thor?" },
          { value: 1200, clue: "In Greek myth, this hero must complete twelve labors.", answer: "Who is Hercules?" },
          { value: 1600, clue: "This winged horse sprang from the blood of Medusa.", answer: "What is Pegasus?" },
          { value: 2000, clue: "This Egyptian god of the afterlife has the head of a jackal.", answer: "Who is Anubis?" }
        ]
      }
    ]
  },
  final: {
    category: "WORLD LANDMARKS",
    clue: "Completed in 1889 as a temporary entrance arch, this Paris landmark was almost torn down in 1909.",
    answer: "What is the Eiffel Tower?"
  }
};
