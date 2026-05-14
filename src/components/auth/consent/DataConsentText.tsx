/**
 * Verbatim text of the AI Ethics & Governance Fellowship Data
 * Protection Consent form, agreed with programme leadership. The
 * three granular opt-ins (recording, comms, alumni comms) live on
 * the form below this body — see DataConsentForm.tsx.
 */
export default function DataConsentText() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h1 className="text-lg font-bold text-gray-900">
        Data Protection Consent — AI Ethics and Governance Fellowship
      </h1>
      <p className="font-semibold text-gray-800">Fellows Data Protection Consent Form</p>
      <p>
        The AI Ethics and Governance Fellowship (&quot;the Programme&quot;) is
        committed to protecting your personal data and handling all
        information responsibly, lawfully, and securely. The AI Ethics and
        Governance Fellowship is administered by Policy Innovation Centre,
        acting as the Data Controller and Processor for your personal
        information.
      </p>
      <p>
        As a Fellow, you may participate in training sessions, mentorship
        activities, collaborative discussions, assignments, projects,
        surveys, and programme evaluation activities related to AI Ethics
        and Governance. Participation may include virtual or in-person
        engagement, submission of learning outputs, and contribution to
        fellowship discussions and activities. Some outputs or contributions
        may be featured in programme reports, publications, or communication
        materials with appropriate consent where necessary.
      </p>
      <p>Please read the following carefully and indicate your consent.</p>

      <h2 className="mt-6 text-base font-semibold text-gray-900">
        Purpose of Data Collection
      </h2>
      <p>Your personal data may be collected and processed for the following purposes:</p>
      <ul>
        <li>Fellowship application review and selection</li>
        <li>Participant onboarding and communication</li>
        <li>Programme delivery and administration</li>
        <li>Learning management and attendance tracking</li>
        <li>Monitoring, evaluation, and impact reporting</li>
        <li>Issuance of certificates or references</li>
        <li>Alumni engagement and future opportunities</li>
        <li>
          Safeguarding, security, and compliance purposes including prevention
          of misconduct, protection of participants, and compliance with
          applicable legal obligations.
        </li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-gray-900">
        Types of Data Collected
      </h2>
      <p>
        Sensitive demographic information will only be collected where
        necessary and with explicit consent. However, the Programme may
        collect:
      </p>
      <ul>
        <li>Full name</li>
        <li>Gender</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Country / organisation / professional background</li>
        <li>CV / résumé / application materials</li>
        <li>Demographic information voluntarily provided</li>
        <li>Session attendance records</li>
        <li>Submitted assignments or projects</li>
        <li>Feedback and survey responses</li>
        <li>Photographs or recordings</li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-gray-900">Data Use Principles</h2>
      <p>Your data will be:</p>
      <ul>
        <li>Used only for legitimate fellowship purposes</li>
        <li>Accessed only by authorised personnel</li>
        <li>Stored securely using appropriate safeguards</li>
        <li>Kept confidential except where disclosure is legally required</li>
        <li>Retained only as long as necessary</li>
      </ul>
      <p>
        You may withdraw your consent at any time by contacting{" "}
        <a
          href="mailto:liaison@aiegfellowship.org"
          className="font-medium text-fellowship-navy underline"
        >
          liaison@aiegfellowship.org
        </a>
        , although this may affect participation in certain programme
        activities.
      </p>

      <h2 className="mt-6 text-base font-semibold text-gray-900">Data Sharing</h2>
      <p>Your information may be shared only with:</p>
      <ul>
        <li>Fellowship administrators and authorised staff</li>
        <li>Trainers, mentors, or assessors where necessary</li>
        <li>Technical service providers supporting programme delivery</li>
        <li>
          Funding or partner institutions for reporting purposes (in
          aggregated or approved formats)
        </li>
      </ul>
      <p>Your personal data will not be sold to third parties.</p>

      <h2 className="mt-6 text-base font-semibold text-gray-900">Data Retention</h2>
      <p>
        The fellowship will retain personal data for a maximum period of one
        (1) year following the completion of the fellowship programme,
        unless:
      </p>
      <ul>
        <li>A longer retention period is required by law or contractual obligations;</li>
        <li>
          Retention is necessary for legitimate reporting, audit, safeguarding,
          or dispute resolution purposes; or
        </li>
        <li>
          Explicit consent has been obtained for continued engagement, such as
          alumni network participation.
        </li>
      </ul>
      <p>
        At the end of the one-year retention period, all personal data will be
        securely deleted, anonymised, or destroyed in accordance with
        established data disposal procedures.
      </p>

      <h2 className="mt-6 text-base font-semibold text-gray-900">
        Confidentiality and Responsible Use
      </h2>
      <p>
        Fellows are expected to respect the privacy and confidentiality of
        other participants and programme materials. Personal information,
        recordings, internal discussions, or non-public materials shared
        during the fellowship should not be distributed externally without
        appropriate permission. Any reuse of fellowship materials, datasets,
        or recordings for research, publication, or public dissemination may
        require prior approval from the Programme.
      </p>

      <h2 className="mt-6 text-base font-semibold text-gray-900">
        Does the Fellow Have a Right to Share Their Own Data?
      </h2>
      <p>
        Yes. Generally, individuals have rights over their own personal
        information. For example, a fellow can usually:
      </p>
      <ul>
        <li>share their certificate;</li>
        <li>mention participation publicly;</li>
        <li>share their own assignments;</li>
        <li>discuss their own experience.</li>
      </ul>
      <p>But they may not automatically have rights to:</p>
      <ul>
        <li>share recordings containing others;</li>
        <li>distribute internal programme documents;</li>
        <li>publish group discussions;</li>
        <li>share participant lists.</li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-gray-900">
        Recordings and Media Consent
      </h2>
      <p>
        Recordings will be used only for educational, archival, or internal
        quality assurance purposes unless separate permission is obtained for
        public use. Use the checkbox below to record your preference.
      </p>
    </div>
  );
}
