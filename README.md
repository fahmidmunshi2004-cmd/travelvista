# TravelVista — Travel Buddies

বন্ধুদের ব্যক্তিগত ভ্রমণ-স্মৃতি রাখার React, Vite ও TypeScript অ্যাপ। এটি ট্রাভেল এজেন্সি, পাবলিক বুকিং বা পেমেন্ট সাইট নয়। Dark cinematic UI, responsive layout এবং বাংলা/English ভাষা পরিবর্তন আছে।

## চালু করা

```sh
npm install
npm run dev
```

Production build ও TypeScript check:

```sh
npm run build
```

বর্তমান `package.json`-এ আলাদা ESLint বা automated test script নেই।

## পেজ ও কাজ

- `/`: cinematic hero, Firestore-ভিত্তিক journey/member/media counts, featured trips, recent photos ও journal cards।
- `/journeys` এবং `/journeys/:id`: search, destination filter, sorting, trip story, itinerary, travel notes, attending friends, linked album photos/videos এবং রেকর্ড করা খরচের field।
- `/friends`: Firestore-এ থাকা সদস্যদের profile, avatar ও bio।
- `/journal` এবং `/journal/:slug`: search, category filter ও individual story pages।
- `/gallery`: destination filter, image/video lightbox; `Escape` এবং arrow keys-এ বন্ধ/পরের media।
- `/about`: settings text ও প্রকাশিত journey থেকে তৈরি timeline।
- `/contact`: Firebase-এ private contact submission; সেটি পাঠাতে login থাকতে হবে।
- Sign-in wall: Email/Password, registration, password reset, Google ও Facebook provider। Social provider Firebase Console-এ চালু থাকতে হবে।
- `/admin`: পাঁচটি dashboard summary এবং বিদ্যমান Tour create/read/update/delete workflow।
- `/admin/content`: website title, tagline, hero text/image, about text, logo URL, accent color, social links এবং Friends, Gallery/Video ও Journal records-এর Firestore editor। Admin save করলে content Firebase-এ থাকে এবং reload-এর পরও ফেরত আসে।

Settings, member, album বা journal content Cloud Firestore থেকে আসে। Records না থাকলে visible sample preview দেখানো হয়; sample card-এ সেটি চিহ্নিত থাকে। Firebase network/rules error হলে sample data-কে cloud-synced বলা হয় না। Demo tour editing থাকলে সেটি local browser storage-এ থাকে।

## Firebase ও Vercel সেটআপ

1. `.env.example` কপি করে `.env.local` তৈরি করুন। Firebase Web App-এর `apiKey`, `authDomain`, `projectId`, `messagingSenderId` ও `appId`-এর জন্য যথাক্রমে `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` দিন। `storageBucket` ঐচ্ছিক।
2. Vercel project-এর **Settings → Environment Variables**-এ একই `VITE_FIREBASE_*` variables যোগ করুন এবং Production deployment আবার চালান। `.env` / `.env.local` Git-এ commit হয় না।
3. Firebase Authentication-এ Email/Password, Google/Facebook provider ও `travelvista-two.vercel.app` Authorized domain চালু করুন।
4. Admin route এবং Firestore write-এর জন্য Firebase Auth custom claim `admin: true` লাগে। এটি শুধু Firebase Admin SDK / trusted environment থেকে দিন; browser client থেকে নয়। Claim দেওয়ার পর পুনরায় sign-in করুন।
5. এই branch-এর Firestore rules deploy করতে:

```sh
firebase deploy --only firestore:rules --project travelvista-87201
```

Frontend বর্তমানে user-provided image/video URLs ব্যবহার করে; Storage upload service-এ চালু নেই, তাই এই phase-এ Storage rules deploy আবশ্যক নয়। কোনো service-account key বা OAuth secret frontend env-এ রাখবেন না।

## Firestore collections

- `publicSettings/main`: `title`, `tagline`, `heroTitle`, `heroText`, `aboutText`, `heroImageUrl`, `logoUrl`, `accentColor`, `socialLinks`। Signed-in members পড়তে পারে; কেবল admin লিখতে পারে।
- `tours/{tourId}`: `title`, `destination`, `startDate`, `endDate`, `coverImageUrl`, `description`, `story`, `itinerary`, `travelDetails`, `attendeeIds`, `albumIds`, `status` (`draft` / `published`)। Members শুধু published tour পড়ে; admin সব tour manage করে।
- `friends/{friendId}`: `name`, optional `nickname`, `avatarUrl`, `bio`, `visibleToMembers`। Members শুধু visible records পড়ে; admin CRUD করে।
- `albums/{albumId}`: `title`, `destination`, `coverImageUrl`, `caption`, `media` array (`url`, `kind`, optional `caption`), `published`। URL-এর শেষাংশ `.mp4`, `.webm` বা `.mov` হলে ভিডিও হিসেবে ধরা হয়।
- `journalPosts/{postId}`: `title`, `slug`, `category`, `excerpt`, `story`, `coverImageUrl`, `published`। Members শুধু published story পড়ে।
- `expenses/{expenseId}`: বর্তমান rules-এ admin-only। পুরোনো browser expense notes এখনও browser-local এবং Firestore-এ সিঙ্ক হয় না।
- `contactSubmissions/{submissionId}`: member contact form থেকে তৈরি; পড়া/পরিবর্তন admin-only।

Social ও media URL `http://`/`https://` হতে হবে; website-local image-এ `/assets/...` path ব্যবহার করা যায়। Admin UI image/video upload করে না; URL records পরিচালনা করে।

## এখনো নেই

- Phone/SMS sign-in; login বর্তমানে email/password ও configured Google/Facebook provider ব্যবহার করে।
- Firebase Storage-এ file upload; hero, logo, cover, profile ও album media URL দিয়ে দেওয়া হয়।
- Expense records তৈরি/সম্পাদনার পূর্ণ cloud UI; বর্তমান expense-entry page localStorage-এ লেখে।
- Automated test suite এবং Firestore Emulator rules test। `npm run build` TypeScript check ও production bundle চালায়।
- Published social/page previews-এর বাইরে server-rendered public SEO metadata।

Login ও home hero-তে ব্যবহৃত Rangamati sunset photograph: [Anvil Chakma / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sunset_at_Rangamati_2018.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
