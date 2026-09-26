/**
 * app/public-names.ts — names a certificate must never print (bible §8.4, §8.5; charter §2.6, §2.7).
 *
 * The certificate is the one artefact that puts a label on a typed name, and it is built to be
 * forwarded. data.ts `certificateName` prints "Anonymous Janta" instead of anything here, on top of
 * every person in the bank's `people` / `enactedBy` lists. Names only: no claims, no roles, no parties
 * attached, so nothing here says anything about anyone. A wrong or extra entry only means a player
 * with that name gets "Anonymous Janta".
 *
 *  - PUBLIC_FIGURES — people: prime ministers and presidents, national leaders, chief ministers and
 *    Union ministers since 2014, party presidents and leaders, judges and regulators named in the
 *    news, anchors, editors and media owners. An interim list: the editorial lane is asked for a
 *    names-only `bank/public-figures.mjs` that replaces it (see the lane report).
 *  - PUBLIC_NAMES — parties (full names and short forms, and every `govt` value from the bank
 *    schema, added in data.ts), the RSS and its affiliates, news outlets (charter §2.1 and the Kiska
 *    Media? lane), institutions, the satire's own targets (Godi Media, IT Cell) and political epithets.
 *  - GROUP_NAMES — religious, caste and regional groups: a label on a community is communal
 *    targeting (charter §2.6), whatever name box it arrives through.
 *  - COMMON_SURNAMES — a lone surname this common names nobody in particular, so it still prints.
 *
 * Plain ASCII or Devanagari strings; data.ts normalises, transliterates and folds them.
 */

export const PUBLIC_FIGURES: readonly string[] = Object.freeze([
  // Prime ministers, presidents, vice-presidents
  'Jawaharlal Nehru', 'Gulzarilal Nanda', 'Lal Bahadur Shastri', 'Indira Gandhi', 'Morarji Desai',
  'Charan Singh', 'Rajiv Gandhi', 'Vishwanath Pratap Singh', 'V. P. Singh', 'Chandra Shekhar',
  'P. V. Narasimha Rao', 'Atal Bihari Vajpayee', 'H. D. Deve Gowda', 'Inder Kumar Gujral', 'I. K. Gujral',
  'Manmohan Singh', 'Narendra Modi', 'Narendra Damodardas Modi', 'Droupadi Murmu', 'Ram Nath Kovind',
  'Pranab Mukherjee', 'Pratibha Patil', 'A. P. J. Abdul Kalam', 'Abdul Kalam', 'C. P. Radhakrishnan',
  'Jagdeep Dhankhar', 'Venkaiah Naidu', 'Hamid Ansari', 'Om Birla',
  // National figures a label must never touch
  'Mahatma Gandhi', 'Mohandas Karamchand Gandhi', 'Subhas Chandra Bose', 'B. R. Ambedkar',
  'Bhimrao Ambedkar', 'Vallabhbhai Patel', 'Sardar Patel', 'Bhagat Singh', 'Vinayak Damodar Savarkar',
  'Veer Savarkar', 'Syama Prasad Mookerjee', 'Deendayal Upadhyaya', 'Ram Manohar Lohia',
  'Jayaprakash Narayan', 'K. B. Hedgewar', 'M. S. Golwalkar', 'Nathuram Godse', 'Maulana Azad',
  'Abul Kalam Azad', 'Kanshi Ram', 'Anna Hazare',
  // Union ministers and national leaders
  'Amit Shah', 'Rajnath Singh', 'Nirmala Sitharaman', 'Subrahmanyam Jaishankar', 'S. Jaishankar',
  'Nitin Gadkari', 'Piyush Goyal', 'Dharmendra Pradhan', 'Ashwini Vaishnaw', 'Jyotiraditya Scindia',
  'Shivraj Singh Chouhan', 'Manohar Lal Khattar', 'Jagat Prakash Nadda', 'J. P. Nadda',
  'H. D. Kumaraswamy', 'Chirag Paswan', 'Jitan Ram Manjhi', 'Kiren Rijiju', 'Hardeep Singh Puri',
  'Mansukh Mandaviya', 'Bhupender Yadav', 'Gajendra Singh Shekhawat', 'Sarbananda Sonowal',
  'Pralhad Joshi', 'Giriraj Singh', 'Annpurna Devi', 'G. Kishan Reddy', 'Ram Mohan Naidu',
  'Rajiv Ranjan Singh', 'Lalan Singh', 'Jual Oram', 'C. R. Patil', 'Arjun Ram Meghwal',
  'Anupriya Patel', 'Smriti Irani', 'Anurag Thakur', 'Ravi Shankar Prasad', 'Prakash Javadekar',
  'Arun Jaitley', 'Sushma Swaraj', 'Ram Vilas Paswan', 'Suresh Prabhu', 'Uma Bharti', 'Maneka Gandhi',
  'Varun Gandhi', 'Harsh Vardhan', 'Mukhtar Abbas Naqvi', 'Ajay Mishra Teni', 'Nityanand Rai',
  'Sushil Kumar Modi', 'Rajeev Chandrasekhar', 'L. K. Advani', 'Lal Krishna Advani',
  'Murli Manohar Joshi', 'Mohan Bhagwat', 'Sambit Patra', 'Subramanian Swamy', 'Kapil Mishra',
  'Parvesh Verma', 'Tejasvi Surya', 'Nishikant Dubey', 'Ramesh Bidhuri',
  // Congress and the opposition at the Centre
  'Mallikarjun Kharge', 'Sonia Gandhi', 'Rahul Gandhi', 'Priyanka Gandhi', 'Priyanka Gandhi Vadra',
  'Robert Vadra', 'P. Chidambaram', 'Kapil Sibal', 'A. K. Antony', 'Salman Khurshid', 'Jairam Ramesh',
  'Ghulam Nabi Azad', 'Veerappa Moily', 'Sushil Kumar Shinde', 'Shashi Tharoor', 'Mani Shankar Aiyar',
  'Digvijaya Singh', 'K. C. Venugopal', 'Pawan Khera', 'Randeep Surjewala', 'Kanhaiya Kumar',
  'Sharad Pawar', 'Supriya Sule', 'Ajit Pawar', 'Arvind Kejriwal', 'Manish Sisodia', 'Atishi',
  'Atishi Marlena', 'Sanjay Singh', 'Raghav Chadha', 'Bhagwant Mann', 'Asaduddin Owaisi',
  'Akbaruddin Owaisi', 'Prashant Kishor', 'Chandrashekhar Azad', 'Mahua Moitra', 'Derek O\'Brien',
  // Chief ministers and state leaders (2014 onward, and the long-serving before)
  'Yogi Adityanath', 'Ajay Mohan Bisht', 'Keshav Prasad Maurya', 'Brajesh Pathak', 'Akhilesh Yadav',
  'Mulayam Singh Yadav', 'Dimple Yadav', 'Mayawati', 'Akash Anand', 'Pushkar Singh Dhami',
  'Trivendra Singh Rawat', 'Harish Rawat', 'Sukhvinder Singh Sukhu', 'Jai Ram Thakur',
  'Nayab Singh Saini', 'Bhupinder Singh Hooda', 'Rekha Gupta', 'Sheila Dikshit', 'Omar Abdullah',
  'Farooq Abdullah', 'Mehbooba Mufti', 'Mufti Mohammad Sayeed', 'Bhajan Lal Sharma', 'Ashok Gehlot',
  'Sachin Pilot', 'Vasundhara Raje', 'Mohan Yadav', 'Kamal Nath', 'Vishnu Deo Sai', 'Bhupesh Baghel',
  'Raman Singh', 'Bhupendra Patel', 'Vijay Rupani', 'Anandiben Patel', 'Hardik Patel',
  'Pramod Sawant', 'Manohar Parrikar', 'Devendra Fadnavis', 'Eknath Shinde', 'Uddhav Thackeray',
  'Aaditya Thackeray', 'Raj Thackeray', 'Bal Thackeray', 'Prithviraj Chavan', 'Siddaramaiah',
  'D. K. Shivakumar', 'B. S. Yediyurappa', 'Basavaraj Bommai', 'Prajwal Revanna', 'Pinarayi Vijayan',
  'Oommen Chandy', 'V. D. Satheesan', 'M. K. Stalin', 'Udhayanidhi Stalin', 'M. Karunanidhi',
  'J. Jayalalithaa', 'Edappadi K. Palaniswami', 'O. Panneerselvam', 'K. Annamalai', 'Joseph Vijay',
  'Kamal Haasan', 'Y. S. Jagan Mohan Reddy', 'Y. S. Rajasekhara Reddy', 'N. Chandrababu Naidu',
  'Nara Lokesh', 'Pawan Kalyan', 'N. T. Rama Rao', 'K. Chandrashekar Rao', 'K. T. Rama Rao',
  'K. Kavitha', 'Revanth Reddy', 'Anumula Revanth Reddy', 'Naveen Patnaik', 'Biju Patnaik',
  'Mohan Charan Majhi', 'Hemant Soren', 'Shibu Soren', 'Kalpana Soren', 'Champai Soren',
  'Babulal Marandi', 'Raghubar Das', 'Lalu Prasad Yadav', 'Rabri Devi', 'Tejashwi Yadav',
  'Tej Pratap Yadav', 'Misa Bharti', 'Nitish Kumar', 'Samrat Choudhary', 'Jitan Manjhi',
  'Mamata Banerjee', 'Abhishek Banerjee', 'Suvendu Adhikari', 'Dilip Ghosh', 'Sukanta Majumdar',
  'Buddhadeb Bhattacharjee', 'Jyoti Basu', 'Himanta Biswa Sarma', 'Tarun Gogoi', 'Pema Khandu',
  'N. Biren Singh', 'Conrad Sangma', 'Neiphiu Rio', 'Lalduhoma', 'Zoramthanga', 'Manik Saha',
  'Biplab Kumar Deb', 'Manik Sarkar', 'Prem Singh Tamang', 'Pawan Chamling', 'Navjot Singh Sidhu',
  'Amarinder Singh', 'Charanjit Singh Channi', 'Sukhbir Singh Badal', 'Parkash Singh Badal',
  'Harsimrat Kaur Badal', 'Bikram Singh Majithia',
  // Judges, regulators, agencies (names in the news)
  'D. Y. Chandrachud', 'Sanjiv Khanna', 'B. R. Gavai', 'Surya Kant', 'N. V. Ramana', 'S. A. Bobde',
  'Ranjan Gogoi', 'Dipak Misra', 'Gyanesh Kumar', 'Rajiv Kumar', 'Sushil Chandra', 'Sanjay Malhotra',
  'Shaktikanta Das', 'Urjit Patel', 'Raghuram Rajan', 'Madhabi Puri Buch', 'Tuhin Kanta Pandey',
  'Ajit Doval',
  // Anchors, editors, fact-checkers, owners
  'Arnab Goswami', 'Sudhir Chaudhary', 'Rajat Sharma', 'Rubika Liyaquat', 'Anjana Om Kashyap',
  'Navika Kumar', 'Amish Devgan', 'Deepak Chaurasia', 'Ravish Kumar', 'Barkha Dutt',
  'Rajdeep Sardesai', 'Sagarika Ghose', 'Prannoy Roy', 'Radhika Roy', 'Nidhi Razdan', 'Karan Thapar',
  'Dhruv Rathee', 'Siddharth Varadarajan', 'Shekhar Gupta', 'Vinod Dua', 'Abhisar Sharma',
  'Punya Prasun Bajpai', 'Chitra Tripathi', 'Sweta Singh', 'Gaurav Sawant', 'Rahul Kanwal',
  'Palki Sharma', 'Suresh Chavhanke', 'Mohammed Zubair', 'Pratik Sinha', 'Aroon Purie', 'Kalli Purie',
  'Vineet Jain', 'Samir Jain', 'Shobhana Bhartia', 'Subhash Chandra', 'Mukesh Ambani', 'Nita Ambani',
  'Anil Ambani', 'Gautam Adani', 'Kalanithi Maran', 'Dayanidhi Maran', 'Vijay Darda',
  // Business names in the scam files
  'Vijay Mallya', 'Nirav Modi', 'Mehul Choksi', 'Lalit Modi', 'Ratan Tata', 'Subrata Roy',
  // One-word names: blocked as the whole name only ('Yogi ji' does not print; 'Yogi Sharma' does)
  'Yogi', 'योगी',
  // Devanagari spellings of the most-typed names
  'नरेंद्र मोदी', 'अमित शाह', 'राहुल गांधी', 'सोनिया गांधी', 'अरविंद केजरीवाल', 'ममता बनर्जी',
  'योगी आदित्यनाथ', 'नीतीश कुमार', 'लालू प्रसाद यादव', 'अखिलेश यादव', 'मायावती', 'उद्धव ठाकरे',
  'महात्मा गांधी', 'जवाहरलाल नेहरू', 'अटल बिहारी वाजपेयी', 'मनमोहन सिंह', 'इंदिरा गांधी',
  'राजनाथ सिंह', 'निर्मला सीतारमण', 'अर्नब गोस्वामी', 'रवीश कुमार', 'गौतम अदाणी', 'मुकेश अंबानी',
]);

export const PUBLIC_NAMES: readonly string[] = Object.freeze([
  // Parties and alliances (full names and the short forms people type)
  'Bharatiya Janata Party', 'BJP', 'Indian National Congress', 'Congress', 'INC', 'Aam Aadmi Party',
  'AAP', 'All India Trinamool Congress', 'Trinamool', 'TMC', 'Dravida Munnetra Kazhagam', 'DMK',
  'All India Anna Dravida Munnetra Kazhagam', 'AIADMK', 'YSR Congress', 'YSRCP', 'Telugu Desam',
  'TDP', 'Bharat Rashtra Samithi', 'Telangana Rashtra Samithi', 'BRS', 'TRS', 'Biju Janata Dal', 'BJD',
  'Jharkhand Mukti Morcha', 'JMM', 'Rashtriya Janata Dal', 'RJD', 'Janata Dal United', 'JDU',
  'Janata Dal Secular', 'JDS', 'Samajwadi Party', 'Bahujan Samaj Party', 'BSP', 'Shiv Sena',
  'Nationalist Congress Party', 'NCP', 'Left Democratic Front', 'LDF', 'United Democratic Front', 'UDF',
  'Sikkim Krantikari Morcha', 'SKM', 'Mizo National Front', 'MNF', 'NDPP', 'National People\'s Party',
  'NPP', 'Zoram People\'s Movement', 'ZPM', 'Communist Party of India', 'CPI', 'CPI(M)', 'CPM',
  'Shiromani Akali Dal', 'Akali Dal', 'AIMIM', 'National Conference', 'PDP', 'MNS', 'INLD', 'TVK',
  'Jan Suraaj', 'NDA', 'UPA', 'INDIA bloc', 'I.N.D.I.A', 'Sangh Parivar',
  'Rashtriya Swayamsevak Sangh', 'RSS', 'Vishva Hindu Parishad', 'VHP', 'Bajrang Dal', 'ABVP',
  'भाजपा', 'कांग्रेस', 'आम आदमी पार्टी', 'तृणमूल', 'समाजवादी पार्टी', 'बसपा', 'शिवसेना', 'आरएसएस', 'संघ',
  // Outlets (charter §2.1 and the Kiska Media? lane)
  'The Hindu', 'Indian Express', 'Hindustan Times', 'Times of India', 'NDTV', 'Scroll', 'The Wire',
  'ThePrint', 'The Print', 'Reuters', 'BBC', 'Mint', 'Livemint', 'Business Standard', 'Economic Times',
  'Deccan Herald', 'The News Minute', 'Newslaundry', 'Alt News', 'BOOM', 'BOOM Live', 'Factly',
  'The Quint', 'OpIndia', 'Swarajya', 'Republic', 'Republic TV', 'Republic Bharat', 'Times Now',
  'Times Now Navbharat', 'Aaj Tak', 'India Today', 'ABP News', 'ABP Majha', 'Zee News', 'Zee',
  'India TV', 'News18', 'Network18', 'CNN-News18', 'CNBC', 'TV9', 'TV9 Bharatvarsh', 'Sudarshan News',
  'News Nation', 'JioStar', 'Dainik Jagran', 'Dainik Bhaskar', 'Amar Ujala', 'Hindustan', 'Lokmat',
  'Saamana', 'Asianet', 'Asianet News', 'Malayala Manorama', 'Mathrubhumi', 'Kairali TV',
  'Janam TV', 'Jaihind TV', 'MediaOne', 'Sun TV', 'Sun News', 'Kalaignar TV', 'Jaya TV', 'News J',
  'Polimer', 'Puthiya Thalaimurai', 'Thanthi TV', 'Sakshi TV', 'Eenadu', 'ETV', 'TV5',
  'T News', 'Namasthe Telangana', 'Odisha TV', 'OTV', 'Sambad', 'PTC News', 'News Live', 'ANI', 'PTI',
  'IANS', 'NewsClick', 'Gaon Connection', 'Anandabazar', 'Republic Bangla', 'Bharat Samachar',
  // Institutions
  'CBI', 'Central Bureau of Investigation', 'ED', 'Enforcement Directorate', 'SEBI', 'CAG',
  'Comptroller and Auditor General', 'ECI', 'Election Commission', 'RBI', 'Reserve Bank of India',
  'Supreme Court', 'High Court', 'NIA', 'Income Tax Department', 'PMO', 'Government of India',
  'Lok Sabha', 'Rajya Sabha', 'Parliament', 'NITI Aayog', 'Indian Army', 'Indian Navy',
  'Indian Air Force', 'Rashtrapati Bhavan', 'Prime Minister', 'Chief Minister', 'Home Minister',
  'Finance Minister', 'Chief Justice', 'Pradhan Mantri', 'Mukhyamantri', 'Pradhan Sevak',
  'प्रधानमंत्री', 'मुख्यमंत्री', 'प्रधान सेवक', 'सुप्रीम कोर्ट', 'चुनाव आयोग',
  // The satire's own targets, and epithets for real people
  'Godi Media', 'IT Cell', 'NaMo', 'RaGa', 'Pappu', 'Feku', 'Fekuchand', 'Didi', 'Chowkidar',
  'Main Bhi Chowkidar', 'Mota Bhai', 'Motabhai', 'Behenji', 'Amma', 'Netaji', 'Bapu', 'Mahatma',
  'Babasaheb', 'Shehzada', 'Shahzada', 'Bulldozer Baba', 'Mauni Baba', 'Vishwaguru',
  'Modiji', 'KCR', 'KTR', 'YSR', 'NTR', 'MGR', 'Thalaivar', 'Thalapathy', 'AK47',
  'गोदी मीडिया', 'आईटी सेल', 'पप्पू', 'फेंकू', 'फेकू', 'दीदी', 'चौकीदार', 'नमो', 'बहनजी', 'अम्मा',
  'नेताजी', 'बापू', 'मोटा भाई', 'शहज़ादा', 'बुलडोज़र बाबा', 'मोदीजी',
]);

/** Singular only where it is not also a given name ('Christian' is; 'Christians' is a community). */
export const GROUP_NAMES: readonly string[] = Object.freeze([
  'Hindu', 'Hindus', 'Muslim', 'Muslims', 'Musalman', 'Musalmans', 'Sikh', 'Sikhs', 'Christians',
  'Buddhist', 'Buddhists', 'Parsi', 'Parsis', 'Jews', 'Dalit', 'Dalits', 'Brahmin', 'Brahmins', 'Adivasi',
  'Adivasis', 'Tribals', 'Rohingya', 'Rohingyas', 'Pakistani', 'Pakistanis', 'Bangladeshi',
  'Bangladeshis', 'Kashmiris', 'Biharis', 'Madrasi', 'Madrasis', 'North Easterners', 'Mullah', 'Mullahs',
  'Minorities',
  'हिंदू', 'हिन्दू', 'मुसलमान', 'मुस्लिम', 'सिख', 'ईसाई', 'दलित', 'ब्राह्मण', 'आदिवासी',
]);

/** A lone surname this common names nobody in particular (so "Sharma" alone still prints). */
export const COMMON_SURNAMES: readonly string[] = Object.freeze([
  'singh', 'kumar', 'kumari', 'sharma', 'verma', 'varma', 'gupta', 'patel', 'yadav', 'reddy', 'rao', 'naidu',
  'das', 'devi', 'khan', 'ali', 'ahmed', 'ahmad', 'hussain', 'husain', 'siddiqui', 'ansari', 'sheikh',
  'shaikh', 'qureshi', 'mishra', 'misra', 'pandey', 'tiwari', 'tripathi', 'dubey', 'dwivedi', 'trivedi',
  'chaturvedi', 'shukla', 'srivastava', 'saxena', 'agarwal', 'aggarwal', 'agrawal', 'jain', 'mehta',
  'desai', 'joshi', 'kulkarni', 'patil', 'jadhav', 'pawar', 'shinde', 'deshmukh', 'chavan', 'more',
  'gaikwad', 'raut', 'nair', 'menon', 'pillai', 'iyer', 'iyengar', 'krishnan', 'subramanian', 'swamy',
  'bose', 'ghosh', 'mukherjee', 'chatterjee', 'banerjee', 'bhattacharya', 'bhattacharjee', 'sen', 'roy',
  'dutta', 'datta', 'saha', 'mondal', 'mandal', 'sarkar', 'chakraborty', 'paul', 'pal', 'biswas',
  'mallick', 'kaur', 'gill', 'sandhu', 'sidhu', 'dhillon', 'grewal', 'bajwa', 'chauhan', 'chouhan',
  'rathore', 'rajput', 'thakur', 'choudhary', 'chaudhary', 'chowdhury', 'sinha', 'prasad', 'mahto',
  'soren', 'murmu', 'oraon', 'munda', 'tudu', 'kapoor', 'khanna', 'malhotra', 'arora', 'bhatia',
  'chopra', 'sethi', 'kohli', 'ahuja', 'kochhar', 'wadhawan', 'sarma', 'gogoi', 'baruah', 'bora',
  'hazarika', 'kalita', 'deka', 'sangma', 'marak', 'lyngdoh', 'panda', 'patra', 'mohanty', 'sahu',
  'nayak', 'naik', 'behera', 'swain', 'pradhan', 'rout', 'jena', 'kamat', 'gaonkar', 'fernandes',
  'dsouza', 'pinto', 'rodrigues', 'james', 'john', 'thomas', 'joseph', 'george', 'mathew', 'varghese',
  'abraham', 'alam', 'rana', 'bhandari', 'raja', 'balaji', 'gowda', 'hegde', 'shetty', 'bhat', 'rai',
  'negi', 'rawat', 'bisht', 'kashyap', 'maurya', 'kushwaha', 'paswan', 'manjhi', 'meena', 'meghwal',
  'irani', 'khatri', 'tandon', 'bedi', 'bakshi', 'lal', 'nath', 'ram', 'chandra', 'kant', 'raj',
  'goyal', 'puri', 'shekhawat', 'prabhu', 'bharti', 'vardhan', 'naqvi', 'chandrasekhar', 'bhagwat',
  'pathak', 'dhami', 'saini', 'hooda', 'dikshit', 'abdullah', 'mufti', 'sayeed', 'gehlot', 'baghel',
  'sawant', 'vijayan', 'patnaik', 'majhi', 'marandi', 'adhikari', 'majumdar', 'basu', 'deb', 'tamang',
  'goswami', 'chaurasia', 'dutt', 'ghose', 'thapar', 'dua', 'bajpai', 'chadha', 'mann', 'aiyar',
  'antony', 'bhasin', 'jalan', 'purkayastha', 'bhuyan', 'singla', 'narayan', 'azad', 'krishna',
  // surnames that are also everyday given names ("Vijay" alone is anyone)
  'surya', 'ramesh', 'venugopal', 'kishor', 'kishore', 'anand', 'sai', 'shivakumar', 'annamalai', 'vijay',
  'kalyan', 'lokesh', 'kavitha', 'ramana', 'rajan', 'zubair', 'prakash', 'kumaraswamy', 'radhakrishnan',
  'nagendra', 'sasikala', 'mohan', 'gopal', 'shekhar',
]);
