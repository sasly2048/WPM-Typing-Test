import json
import os

paragraphs_json_path = r'C:\Users\ragha\.gemini\antigravity\scratch\WPM-Typing-Test\src\data\paragraphs.json'
quotes_json_path = r'C:\Users\ragha\.gemini\antigravity\scratch\WPM-Typing-Test\src\data\quotes.json'
p15_path = r'C:\Users\ragha\.gemini\antigravity\scratch\WPM-Typing-Test\src\content\paragraphs\15s.js'
p30_path = r'C:\Users\ragha\.gemini\antigravity\scratch\WPM-Typing-Test\src\content\paragraphs\30s.js'
p60_path = r'C:\Users\ragha\.gemini\antigravity\scratch\WPM-Typing-Test\src\content\paragraphs\60s.js'

paragraphs = [
    {"id": 1, "text": "The wind howled through the ancient trees, their branches scraping against the old mansion's windows like skeletal fingers. Inside, a solitary candle flickered, casting long, dancing shadows on the peeling wallpaper. A sudden draft extinguished the flame, plunging the room into darkness.", "source": "Original", "difficulty": "medium", "category": "literature"},
    {"id": 2, "text": "Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles. It is the foundation of all quantum physics including quantum chemistry, quantum field theory, quantum technology, and quantum information science.", "source": "Science Encyclopedia", "difficulty": "hard", "category": "science"},
    {"id": 3, "text": "The sun rises in the east and sets in the west. Every morning birds sing their cheerful songs to welcome the new day. Children play in the park until it gets dark, when they head home for dinner.", "source": "Original", "difficulty": "easy", "category": "nature"},
    {"id": 4, "text": "Artificial intelligence algorithms are increasingly being deployed in various sectors, from healthcare diagnostics to autonomous vehicles. While the potential benefits are immense, it raises profound ethical and philosophical questions about agency, liability, and the nature of consciousness itself.", "source": "Tech Journal", "difficulty": "hard", "category": "technology"},
    {"id": 5, "text": "To be or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and by opposing end them.", "source": "Hamlet, William Shakespeare", "difficulty": "medium", "category": "literature"},
    {"id": 6, "text": "Software engineering is the systematic application of engineering approaches to the development of software. A software engineer is a person who applies the principles of software engineering to design, develop, maintain, test, and evaluate computer software.", "source": "Tech Fundamentals", "difficulty": "medium", "category": "technology"},
    {"id": 7, "text": "The industrial revolution marked a major turning point in history; almost every aspect of daily life was influenced in some way. In particular, average income and population began to exhibit unprecedented sustained growth. Standard of living for the general population began to increase consistently for the first time in history.", "source": "History Almanac", "difficulty": "hard", "category": "history"},
    {"id": 8, "text": "Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy. This chemical energy is later released to fuel the organisms' activities. This process is largely responsible for producing and maintaining the oxygen content of the Earth's atmosphere.", "source": "Biology Textbook", "difficulty": "medium", "category": "science"},
    {"id": 9, "text": "In economics, inflation is a general increase in the prices of goods and services in an economy. When the general price level rises, each unit of currency buys fewer goods and services. Consequently, inflation corresponds to a reduction in the purchasing power of money.", "source": "Economics Daily", "difficulty": "medium", "category": "business"},
    {"id": 10, "text": "Machine learning is a field of inquiry devoted to understanding and building methods that learn, that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data.", "source": "AI Weekly", "difficulty": "hard", "category": "technology"},
    {"id": 11, "text": "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information, extorting money from users via ransomware, or interrupting normal business processes.", "source": "Cyber Info", "difficulty": "medium", "category": "technology"},
    {"id": 12, "text": "The Renaissance was a fervent period of European cultural, artistic, political and economic rebirth following the Middle Ages. Generally described as taking place from the 14th century to the 17th century, the Renaissance promoted the rediscovery of classical philosophy, literature and art.", "source": "History Encyclopedia", "difficulty": "hard", "category": "history"},
    {"id": 13, "text": "Deep learning architectures such as deep neural networks, deep belief networks, and recurrent neural networks have been applied to fields including computer vision, speech recognition, natural language processing, and audio recognition. They have produced results comparable to and in some cases surpassing human expert performance.", "source": "AI Research", "difficulty": "hard", "category": "technology"},
    {"id": 14, "text": "A supply chain is a system of organizations, people, activities, information, and resources involved in supplying a product or service to a consumer. Supply chain activities involve the transformation of natural resources, raw materials, and components into a finished product.", "source": "Business Review", "difficulty": "medium", "category": "business"},
    {"id": 15, "text": "Stoicism is a school of Hellenistic philosophy which was founded by Zeno of Citium in Athens in the early 3rd century BC. It is a philosophy of personal ethics informed by its system of logic and its views on the natural world.", "source": "Philosophy Basics", "difficulty": "hard", "category": "literature"},
    {"id": 16, "text": "Global warming is the long-term heating of Earth's climate system observed since the pre-industrial period due to human activities, primarily fossil fuel burning. This increases heat-trapping greenhouse gas levels in Earth's atmosphere.", "source": "Nature Journal", "difficulty": "medium", "category": "nature"},
    {"id": 17, "text": "Venture capital is a form of private equity financing that is provided by venture capital firms or funds to startups, early-stage, and emerging companies that have been deemed to have high growth potential or which have demonstrated high growth. Venture capital firms or funds invest in these early-stage companies in exchange for equity.", "source": "Finance World", "difficulty": "hard", "category": "business"},
    {"id": 18, "text": "Cryptography is the practice and study of techniques for secure communication in the presence of adversarial behavior. More generally, cryptography is about constructing and analyzing protocols that prevent third parties or the public from reading private messages.", "source": "Security Weekly", "difficulty": "hard", "category": "technology"},
    {"id": 19, "text": "The Roman Empire was the post-Republican period of ancient Rome. As a polity it included large territorial holdings around the Mediterranean Sea in Europe, Northern Africa, and Western Asia ruled by emperors. The first two centuries of the empire saw a period of unprecedented stability and prosperity.", "source": "Historical Times", "difficulty": "medium", "category": "history"},
    {"id": 20, "text": "DNA, or deoxyribonucleic acid, is a molecule composed of two polynucleotide chains that coil around each other to form a double helix. The molecule carries genetic instructions for the development, functioning, growth and reproduction of all known organisms and many viruses.", "source": "Genetics Guide", "difficulty": "hard", "category": "science"},
    {"id": 21, "text": "Existentialism is a form of philosophical inquiry that explores the problem of human existence and centers on the lived experience of the thinking, feeling, acting individual. In the view of the existentialist, the individual's starting point is characterized by what has been called the existential attitude.", "source": "Philosophy Digest", "difficulty": "hard", "category": "literature"},
    {"id": 22, "text": "A computer virus is a type of computer program that, when executed, replicates itself by modifying other computer programs and inserting its own code. If this replication succeeds, the affected areas are then said to be infected with a computer virus.", "source": "Security Basics", "difficulty": "medium", "category": "technology"},
    {"id": 23, "text": "Natural selection is the differential survival and reproduction of individuals due to differences in phenotype. It is a key mechanism of evolution, the change in the heritable traits characteristic of a population over generations. Charles Darwin popularized the term natural selection.", "source": "Biology Review", "difficulty": "medium", "category": "science"},
    {"id": 24, "text": "The Cold War was a period of geopolitical tension between the United States and the Soviet Union and their respective allies, the Western Bloc and the Eastern Bloc. The term cold is used because there was no large-scale fighting directly between the two superpowers.", "source": "Modern History", "difficulty": "medium", "category": "history"},
    {"id": 25, "text": "Microeconomics is a branch of economics that studies the behavior of individuals and firms in making decisions regarding the allocation of scarce resources and the interactions among these individuals and firms. It focuses on the study of markets and prices.", "source": "Econ 101", "difficulty": "medium", "category": "business"},
    {"id": 26, "text": "Software testing is an investigation conducted to provide stakeholders with information about the quality of the software product or service under test. Software testing can also provide an objective, independent view of the software to allow the business to appreciate and understand the risks of software implementation.", "source": "QA Journal", "difficulty": "medium", "category": "technology"},
    {"id": 27, "text": "The Milky Way is the galaxy that includes our Solar System, with the name describing the galaxy's appearance from Earth: a hazy band of light seen in the night sky formed from stars that cannot be individually distinguished by the naked eye.", "source": "Astronomy Now", "difficulty": "easy", "category": "science"},
    {"id": 28, "text": "Phishing is a type of social engineering where an attacker sends a fraudulent message designed to trick a human victim into revealing sensitive information to the attacker or to deploy malicious software on the victim's infrastructure like ransomware.", "source": "Cyber Alert", "difficulty": "medium", "category": "technology"},
    {"id": 29, "text": "Romanticism was an artistic, literary, musical, and intellectual movement that originated in Europe towards the end of the 18th century. It was characterized by its emphasis on emotion and individualism, as well as glorification of all the past and nature.", "source": "Arts & Culture", "difficulty": "hard", "category": "literature"},
    {"id": 30, "text": "Blockchain is a distributed ledger with growing lists of records that are securely linked together via cryptographic hashes. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data, generally represented as a Merkle tree.", "source": "Tech Innovations", "difficulty": "hard", "category": "technology"},
    {"id": 31, "text": "Marketing is the process of exploring, creating, and delivering value to meet the needs of a target market in terms of goods and services; potentially including selection of a target audience; selection of certain attributes or themes to emphasize in advertising; operation of advertising campaigns; and design of products and packaging.", "source": "Business Insights", "difficulty": "hard", "category": "business"},
    {"id": 32, "text": "The Great Depression was a severe worldwide economic depression that took place mostly during the 1930s, beginning in the United States. The timing of the Great Depression varied across the world; in most countries, it started in 1929 and lasted until the late 1930s.", "source": "Economic History", "difficulty": "medium", "category": "history"}
]

quotes = [
    {"id": 1, "text": "Be yourself; everyone else is already taken.", "author": "Oscar Wilde", "difficulty": "easy"},
    {"id": 2, "text": "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", "author": "Albert Einstein", "difficulty": "medium"},
    {"id": 3, "text": "You've gotta dance like there's nobody watching, love like you'll never be hurt, sing like there's nobody listening, and live like it's heaven on earth.", "author": "William W. Purkey", "difficulty": "hard"},
    {"id": 4, "text": "Be the change that you wish to see in the world.", "author": "Mahatma Gandhi", "difficulty": "easy"},
    {"id": 5, "text": "In three words I can sum up everything I've learned about life: it goes on.", "author": "Robert Frost", "difficulty": "medium"},
    {"id": 6, "text": "If you want to know what a man's like, take a good look at how he treats his inferiors, not his equals.", "author": "J.K. Rowling", "difficulty": "medium"},
    {"id": 7, "text": "The only way to do great work is to love what you do.", "author": "Steve Jobs", "difficulty": "easy"},
    {"id": 8, "text": "I have not failed. I've just found 10,000 ways that won't work.", "author": "Thomas A. Edison", "difficulty": "medium"},
    {"id": 9, "text": "The future belongs to those who believe in the beauty of their dreams.", "author": "Eleanor Roosevelt", "difficulty": "medium"},
    {"id": 10, "text": "It does not matter how slowly you go as long as you do not stop.", "author": "Confucius", "difficulty": "easy"},
    {"id": 11, "text": "Everything you can imagine is real.", "author": "Pablo Picasso", "difficulty": "easy"},
    {"id": 12, "text": "Whatever you are, be a good one.", "author": "Abraham Lincoln", "difficulty": "easy"},
    {"id": 13, "text": "The only impossible journey is the one you never begin.", "author": "Tony Robbins", "difficulty": "medium"},
    {"id": 14, "text": "Life is what happens when you're busy making other plans.", "author": "John Lennon", "difficulty": "medium"},
    {"id": 15, "text": "You only live once, but if you do it right, once is enough.", "author": "Mae West", "difficulty": "medium"},
    {"id": 16, "text": "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", "author": "Ralph Waldo Emerson", "difficulty": "hard"},
    {"id": 17, "text": "The mind is everything. What you think you become.", "author": "Buddha", "difficulty": "easy"},
    {"id": 18, "text": "The best time to plant a tree was 20 years ago. The second best time is now.", "author": "Chinese Proverb", "difficulty": "medium"},
    {"id": 19, "text": "Your time is limited, so don't waste it living someone else's life.", "author": "Steve Jobs", "difficulty": "medium"},
    {"id": 20, "text": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill", "difficulty": "hard"},
    {"id": 21, "text": "Innovation distinguishes between a leader and a follower.", "author": "Steve Jobs", "difficulty": "easy"},
    {"id": 22, "text": "The unexamined life is not worth living.", "author": "Socrates", "difficulty": "medium"},
    {"id": 23, "text": "I think, therefore I am.", "author": "René Descartes", "difficulty": "easy"},
    {"id": 24, "text": "That which does not kill us makes us stronger.", "author": "Friedrich Nietzsche", "difficulty": "medium"},
    {"id": 25, "text": "Knowledge is power.", "author": "Sir Francis Bacon", "difficulty": "easy"},
    {"id": 26, "text": "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.", "author": "Albert Einstein", "difficulty": "hard"},
    {"id": 27, "text": "Simplicity is the ultimate sophistication.", "author": "Leonardo da Vinci", "difficulty": "medium"},
    {"id": 28, "text": "Genius is one percent inspiration and ninety-nine percent perspiration.", "author": "Thomas A. Edison", "difficulty": "medium"},
    {"id": 29, "text": "If I have seen further it is by standing on the shoulders of Giants.", "author": "Isaac Newton", "difficulty": "medium"},
    {"id": 30, "text": "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "author": "Aristotle", "difficulty": "hard"},
    {"id": 31, "text": "Science is organized knowledge. Wisdom is organized life.", "author": "Immanuel Kant", "difficulty": "medium"},
    {"id": 32, "text": "The good life is one inspired by love and guided by knowledge.", "author": "Bertrand Russell", "difficulty": "hard"},
    {"id": 33, "text": "Do not go gentle into that good night. Rage, rage against the dying of the light.", "author": "Dylan Thomas", "difficulty": "hard"},
    {"id": 34, "text": "All human actions have one or more of these seven causes: chance, nature, compulsions, habit, reason, passion, desire.", "author": "Aristotle", "difficulty": "hard"},
    {"id": 35, "text": "Those who cannot remember the past are condemned to repeat it.", "author": "George Santayana", "difficulty": "medium"},
    {"id": 36, "text": "The journey of a thousand miles begins with one step.", "author": "Lao Tzu", "difficulty": "easy"},
    {"id": 37, "text": "Life must be understood backward. But it must be lived forward.", "author": "Søren Kierkegaard", "difficulty": "medium"},
    {"id": 38, "text": "Man is the only creature who refuses to be what he is.", "author": "Albert Camus", "difficulty": "medium"},
    {"id": 39, "text": "Happiness is not an ideal of reason, but of imagination.", "author": "Immanuel Kant", "difficulty": "hard"},
    {"id": 40, "text": "I attribute my success to this: I never gave or took any excuse.", "author": "Florence Nightingale", "difficulty": "medium"},
    {"id": 41, "text": "Strive not to be a success, but rather to be of value.", "author": "Albert Einstein", "difficulty": "medium"},
    {"id": 42, "text": "The most difficult thing is the decision to act, the rest is merely tenacity.", "author": "Amelia Earhart", "difficulty": "hard"}
]

with open(paragraphs_json_path, 'w', encoding='utf-8') as f:
    json.dump(paragraphs, f, indent=2)

with open(quotes_json_path, 'w', encoding='utf-8') as f:
    json.dump(quotes, f, indent=2)

p15_content = """export const PARAGRAPHS_15S = [
  { id: 'p15-1', text: "Simplicity is about subtracting the obvious and adding the meaningful. True design elegance lies in removing every unnecessary distraction from the user's path." },
  { id: 'p15-2', text: "Great software feels like an extension of thought. When performance meets purposeful design, practicing complex skills becomes effortless and deeply rewarding." },
  { id: 'p15-3', text: "Focus is a muscle that strengthens with deliberate practice. Consistency every single day outweighs short bursts of intense effort." },
  { id: 'p15-4', text: "The first step in any successful project is understanding the requirements. Without a clear goal, even the best team will struggle." },
  { id: 'p15-5', text: "In the world of technology, change is the only constant. Embracing new tools and methodologies is essential for staying relevant." },
  { id: 'p15-6', text: "A user interface is like a joke. If you have to explain it, it is not that good. Clarity should always be the priority." },
  { id: 'p15-7', text: "Writing code is easy, but writing good code is hard. It requires a deep understanding of the problem and the tools." },
  { id: 'p15-8', text: "Data is the new oil. It is valuable, but if unrefined it cannot really be used. It has to be changed into gas, plastic, chemicals, etc." }
];"""

with open(p15_path, 'w', encoding='utf-8') as f:
    f.write(p15_content)

p30_content = """export const PARAGRAPHS_30S = [
  { id: 'p30-1', text: "The art of writing clean code requires patience, clarity, and continuous refinement. Master developers treat code not merely as instructions for a computer, but as a form of communication meant to be read effortlessly by future engineers who will maintain and expand the system." },
  { id: 'p30-2', text: "Typing speed is not just about raw physical dexterity; it is a direct reflection of muscle memory and cognitive processing speed. When your fingers move in rhythm with your thoughts, the friction between ideas and execution completely disappears." },
  { id: 'p30-3', text: "Cybersecurity is no longer just an IT issue; it is a fundamental business risk. Organizations must adopt a proactive approach to threat detection and response, ensuring that their critical assets are protected against increasingly sophisticated adversaries." },
  { id: 'p30-4', text: "Machine learning models require vast amounts of high-quality data to function effectively. The process of gathering, cleaning, and labeling this data is often the most time-consuming and expensive part of developing an artificial intelligence system." },
  { id: 'p30-5', text: "The history of the internet is a testament to the power of open standards and collaborative innovation. From its origins as a research network, it has evolved into a global infrastructure that underpins the modern digital economy." },
  { id: 'p30-6', text: "Effective communication is the cornerstone of any successful team. Whether you are writing an email, giving a presentation, or participating in a meeting, the ability to convey your ideas clearly and concisely is an invaluable skill." }
];"""

with open(p30_path, 'w', encoding='utf-8') as f:
    f.write(p30_content)

p60_content = """export const PARAGRAPHS_60S = [
  { id: 'p60-1', text: "Building high-performance applications demands a deep understanding of computer architecture and system design. Every layer of abstraction—from high-level user interfaces to underlying kernel operations—introduces trade-offs between memory consumption, CPU execution cycles, and developer ergonomics. The most resilient software engineering teams prioritize zero-dependency implementations, deterministic execution paths, and exhaustive benchmarking. By measuring performance under real-world workloads, developers eliminate latency bottlenecks, reduce garbage collection overhead, and deliver user experiences that feel instantaneous, reliable, and fundamentally delightful across diverse hardware platforms." },
  { id: 'p60-2', text: "The philosophical implications of artificial general intelligence are profound and far-reaching. If a machine can truly think, reason, and experience consciousness in a manner comparable to humans, it challenges our fundamental understanding of what it means to be alive. Ethical frameworks must be established to govern the development and deployment of such systems, ensuring that they are aligned with human values and do not pose an existential threat to our species. The debate over machine rights, accountability, and the potential for an intelligence explosion will likely dominate discourse in the coming decades." },
  { id: 'p60-3', text: "The transition to renewable energy sources is one of the most critical challenges facing humanity in the 21st century. Fossil fuels have driven unprecedented economic growth, but their environmental cost is no longer sustainable. Solar, wind, and geothermal technologies offer a viable path forward, provided we can overcome the technical and economic hurdles associated with energy storage and grid integration. A concerted global effort, combining government policy, private sector innovation, and individual behavioral changes, is required to mitigate the worst effects of climate change and secure a sustainable future for generations to come." }
];"""

with open(p60_path, 'w', encoding='utf-8') as f:
    f.write(p60_content)

print("Expansion script completed successfully.")
