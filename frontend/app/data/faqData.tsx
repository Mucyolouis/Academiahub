export const faqData = [
  {
    id: 1,
    question: "What is AcademiaHub?",
    answer:
      "AcademiaHub is an online platform where students, researchers, and professionals can access, share, and publish academic materials. It serves as a central hub for learning resources, publications, and collaboration within the academic community.",
  },
  {
    id: 2,
    question: "How to create account?",
    answer: (
      <div>
        <b className="text-lg">To create an account:</b>
        <ol className="list-decimal list-inside mt-3 space-y-3 ml-2 ">
          <li>Visit the AcademiaHub website.</li>
          <li>Click on “Sign Up”</li>
          <li>Fill in your basic details (name, email, password)</li>
          <li>Verify your email through the confirmation link.</li>
          <li>Log in and complete your profile.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 3,
    question: "Is AcademiaHub free to use?",
    answer:
      "Yes. AcademiaHub offers free access to browse publications and create an account. Some advanced features may be premium, but the core platform is completely free for users.",
  },
  {
    id: 4,
    question: "How are publications reviewed and approved?",
    answer: (
      <div>
        <p className="text-lg">
          Every uploaded publication goes through a review process handled by
          the AcademiaHub moderation team. They check for:
        </p>
        <ul className="list-disc list-inside mt-6 space-y-3 ml-2 ">
          <li>Originality</li>
          <li>Relevance</li>
          <li>PLagiarism issues</li>
        </ul>
        <p className="text-lg mt-4">
          Once it meets the required standards, it gets approved and published.
        </p>
      </div>
    ),
  },
  {
    id: 5,
    question: "Can I upload my own publication?",
    answer:
      "Yes. Users can upload their own research papers, articles, and academic documents. You simply log in, go to the “Upload” section, submit your file, and it will be reviewed before appearing on the platform.",
  },
  {
    id: 6,
    question: "How is my data protected?",
    answer:
      "AcademiaHub uses secure encryption methods and strict privacy policies to protect your information. Your personal data is never shared with third parties without consent, and all uploaded files are stored on secure servers",
  },
  {
    id: 7,
    question: "What if I find plagiarized publications?",
    answer:
      "If you detect plagiarized or duplicated content, you can report it using the “Report” button on the publication page. The moderation team will investigate and take appropriate action, including removal or account sanctions.",
  },
];

export const publicationFaq = [
  {
    id: 1,
    question: "How do I upload a publication?",
    answer:
      "Go to your dashboard and click on Upload publication. Select your PDF file, add the required details such as title and description, then submit. Your publication will be processed and made available shortly.",
  },
  {
    id: 2,
    question: "What file formats are supported?",
    answer:
      "Currently, only PDF files are supported to ensure consistency and accessibility.",
  },
  {
    id: 3,
    question: "Can I update my uploaded file?",
    answer:
      "Yes. Open your publication and use the available options to upload a new version or update details.",
  },
  {
    id: 4,
    question: "Why can’t I download a file?",
    answer:
      "Check your internet connection or try again. If the issue persists, the file may be restricted or temporarily unavailable.",
  },
  {
    id: 5,
    question: "Why is my publication not visible?",
    answer:
      "It may still be processing or may not meet platform guidelines. Try refreshing or check again later",
  },
];

export const profileFaq = [
  {
    id: 1,
    question: "How do I reset my password?",
    answer:
      "Click “Forgot password” on the login screen and follow the instructions sent to your email.",
  },
  {
    id: 2,
    question: "Can I edit my profile information?",
    answer:
      "Yes. Go to your profile settings to update your name, bio, and other details.",
  },
  {
    id: 3,
    question: "Why can’t I log into my account?",
    answer:
      "Ensure your email and password are correct. If the issue continues, reset your password.",
  },
  {
    id: 4,
    question: "Can I delete my account?",
    answer:
      "Account deletion may be available in settings or by contacting support.",
  },
];

export const notificationsFaq = [
  {
    id: 1,
    question: "What are app notifications?",
    answer:
      "These are updates you receive on the platform, such as activity and messages.",
  },
  {
    id: 2,
    question: "Why am I not receiving notifications?",
    answer: "Check your notification settings and ensure they are turned on.",
  },
  {
    id: 3,
    question: "Can I turn off notifications?",
    answer: "Yes. You can control notification preferences in your settings.",
  },
  {
    id: 4,
    question: "What notifications will I receive?",
    answer:
      "You may receive updates for activity (likes, comments, downloads) and messages.",
  },
];

export const settingsFaq = [
  {
    id: 1,
    question: "How do I access my settings?",
    answer: "Go to your profile and click on 'Settings'.",
  },
  {
    id: 2,
    question: "Can I control who messages me?",
    answer: "Yes. You can enable or disable messaging in your settings.",
  },
  {
    id: 3,
    question: "How do I manage my notification preferences?",
    answer: "Go to settings and adjust your notification options.",
  },
  {
    id: 4,
    question: "Is my data secure?",
    answer:
      "We take user privacy seriously and implement measures to protect your data.",
  },
];
