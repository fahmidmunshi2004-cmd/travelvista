# TravelVista

বন্ধুদের ব্যক্তিগত ভ্রমণ-স্মৃতি রাখার React + Vite + TypeScript অ্যাপ। এটি ট্রাভেল এজেন্সি বা পাবলিক বুকিং সাইট নয়।

## চালু করা

```sh
npm install
npm run dev
```

Production build যাচাই: `npm run build`

## Admin Dashboard ও Tour Management

`/admin` পেজে পাঁচটি সারাংশ দেখা যায়: মোট ভ্রমণ, আলাদা গন্তব্য, বন্ধু, অ্যালবাম এবং রেকর্ড করা খরচ। তালিকায় শিরোনাম/গন্তব্য খোঁজা, গন্তব্য ও draft/published অবস্থা ফিল্টার এবং তারিখ, নাম বা খরচ অনুসারে সাজানো যায়।

Tour তৈরি, সম্পাদনা ও মুছতে শিরোনাম, গন্তব্য, শুরু/শেষের তারিখ, cover image URL, সংক্ষিপ্ত বিবরণ, গল্প, itinerary, যাতায়াত/থাকার তথ্য, উপস্থিত বন্ধু, অ্যালবাম এবং draft/published অবস্থা নির্ধারণ করা যায়। ফর্মে প্রয়োজনীয় তথ্য, তারিখের ক্রম ও image URL যাচাই হয়; delete করার আগে নিশ্চিতকরণ চাওয়া হয়। ভ্রমণের শিরোনাম বা “Details” নির্বাচন করলে `/admin/tours/:tourId`-এ আলাদা বিস্তারিত পেজ খোলে।

## সদস্য লগইন ও অ্যাপ অ্যাক্সেস

এখন প্রতিটি route-এর আগে Firebase Auth session যাচাই হয়। Firebase সেটআপ না থাকলে login screen দেখায়, কিন্তু লগইন চালু হয় না। লগইন করা account-এর Firebase custom claim `member: true` অথবা `admin: true` থাকতে হবে; claim না থাকলে account approval বার্তা দেখানো হয় এবং private pages খোলে না। Login screen-এ Email/Password, Google ও Facebook sign-in আছে; self-registration নেই। Authenticated অবস্থায় header-এর Sign out/লগআউট বোতাম দিয়ে বের হওয়া যায়। Firestore rules-এও সদস্য/অ্যাডমিন check আছে, এবং contact submission-এ login বাধ্যতামূলক।

### Local demo mode

Firebase config না থাকলে Admin পেজে **Local demo mode** লেখা থাকে। পুরোনো `tv-trips` localStorage রেকর্ড প্রথমবার নতুন ট্যুর মডেলে কপি হয়; পুরোনো ডেটা মুছে ফেলা হয় না। নতুন সম্পাদনা `localStorage`-এ থাকে, অন্য browser/device-এ যায় না। Draft tour homepage/public journey list-এ দেখানো হয় না। পুরোনো নমুনা খরচকে recorded expense হিসেবে ধরা হয় না; আলাদা legacy estimate হিসেবে দেখানো হয়।

### Firebase / Firestore mode

`.env.example` কপি করে `.env.local` তৈরি করুন এবং Firebase Web App config-এর পাঁচটি প্রয়োজনীয় মান (`apiKey`, `authDomain`, `projectId`, `messagingSenderId`, `appId`) দিন। `storageBucket` optional; এটি শুধু Firebase Storage ব্যবহার করলে লাগবে। Firebase config থাকলে Admin পেজ Firebase Auth-এর `admin: true` custom claim যাচাই করে। অনুমতি না থাকলে নিয়ন্ত্রণ-প্যানেল বন্ধ থাকে। ট্যুর, বন্ধু, অ্যালবাম ও খরচ পড়তে এবং ট্যুর create/update/delete করতে Firestore rules-ও `admin` claim যাচাই করে। Configured Firebase-এ network/rules/auth ত্রুটি হলে error দেখানো হয়; ডেটা localStorage-এ সরিয়ে লেখা হয় না।

Firebase CLI-তে **Firestore** feature বাছুন। `firebase.json` `firestore.rules`-কে rules file হিসেবে যুক্ত করে, Hosting-এর জন্য `dist` এবং SPA rewrite সেট করে; `.firebaserc` project-টি `travelvista-87201` হিসেবে নির্বাচন করে। Firestore Console-এ database আগে তৈরি না থাকলে তৈরি করুন। Deploy করতে `npm run build`-এর পর `firebase deploy --only firestore:rules,hosting` চালান। Storage upload এই phase-এ configure করা হয়নি।

Firestore collections:

- `tours/{tourId}`: `title`, `destination`, `startDate` (`YYYY-MM-DD`), `endDate`, `coverImageUrl`, `description`, `story`, `itinerary`, `travelDetails`, `attendeeIds`, `albumIds`, `status` (`draft` / `published`), `createdAt`, `updatedAt`
- `friends/{friendId}`: `name`, optional `nickname`, optional `visibleToMembers`
- `albums/{albumId}`: `title`, optional `tourId`, optional `published`
- `expenses/{expenseId}`: `tourId`, numeric `amount` এবং খরচের অন্যান্য বিবরণ

বন্ধু ও অ্যালবামের ব্যবস্থাপনা আলাদা মডিউল; এই phase-এ Admin Dashboard বিদ্যমান Firebase records পড়ে, কিন্তু বন্ধু/অ্যালবাম তৈরি বা সম্পাদনা করে না। খরচের total বিদ্যমান `expenses` রেকর্ড থেকে হিসাব হয়; এই phase নতুন expense CRUD যোগ করে না।

### Firebase নিরাপত্তা চালু করা

1. Firebase Console-এ Authentication-এ Email/Password, Google/Facebook এবং অনুমোদিত domains সেট করুন। Provider চালু না করা পর্যন্ত social login কাজ করবে না।
2. Firestore ও Storage তৈরি করে `firestore.rules` এবং `storage.rules` deploy করুন।
3. প্রথম অ্যাডমিন ব্যবহারকারীর custom claim `admin: true` এবং অনুমোদিত সদস্যদের `member: true` Firebase Admin SDK-সহ বিশ্বস্ত server environment থেকে দিন। অ্যাডমিন claim-ও অ্যাপের সদস্য প্রবেশাধিকার দেয়। ক্লায়েন্টে claim দেওয়ার code নেই—এটি ইচ্ছাকৃত; কোনো user-editable field-কে admin অনুমতি ধরা হয় না।
4. `admin` claim পরিবর্তনের পর নতুন ID token নিতে পুনরায় sign-in করুন।

কোনো service-account key বা OAuth secret `.env.local`/frontend code-এ রাখবেন না। Firebase auth, Firestore rules এবং OAuth credentials সেট না থাকলে প্রকৃত cloud operation যাচাই করা সম্ভব নয়।

## এই phase-এ এখনো নেই

- Firebase storage থেকে cover upload; বর্তমানে validated HTTP/HTTPS image URL ব্যবহার করা হয়।
- Admin CRUD-এর বাইরে পূর্ণ Friends/Albums management এবং per-tour expense entry UI।
- Firestore admin access-এর rules emulator test; Firebase project ও emulator configuration দেওয়া হয়নি।
- Automated test script; বর্তমান `package.json`-এ test command নেই।
