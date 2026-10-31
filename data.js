/* =========================================================
   YOUR CONTENT LIVES HERE
   Edit this file to update the site — no other file needs to
   change. Put pictures in assets/images/ and PDFs/scans in
   assets/docs/, then reference them by path below.
   Dates: "YYYY-MM" or "YYYY-MM-DD".
   ========================================================= */

window.PORTFOLIO = {

  profile: {
    name: "Brandon Restrepo",
    className: "Security Analyst",          // small line above your name
    tagline: "Welcome to my portfolio",
    level: 99,                               // shown level; 99 = max level with EXP capped
    cta: { label: "Contact", url: "mailto:brandonlelouch@gmail.com" },
    site: "",                                    // your live link once it's hosted (e.g. "https://brandonrestrepo.com"); the "Copy link" button shares this
    previewLink: "https://claude.ai/artifact/QD62iwfebwG2WryqXNoEU4",   // used by "Copy link" until the site is hosted (share it from the preview's Share menu first)
    resume: "assets/docs/Brandon_Restrepo_Resume.pdf",
    resumePages: ["assets/docs/resume-pages/page-1.webp"],   // the PDF rendered as images, shown in Quick view and the résumé viewer (works everywhere, phones included)            // "Résumé" button (top right)
    links: {                                                       // icon buttons; leave "" to hide
      linkedin: "https://www.linkedin.com/in/brandon-restrepo-b107a32b8",
      github: ""                                                   // e.g. "https://github.com/your-username"
    },
    art: "assets/images/brandon-art-base.webp",   // your artwork on the title screen (Cutiefly is a separate layer so it can fly)
    artDark: "assets/images/brandon-art-dark.webp",  // same art with the blue rim light + colour grade baked in (Twilight)
    artLight: "assets/images/brandon-art-light.webp", // same, softer version for day mode
    artFull: "assets/images/brandon-art.webp",    // the complete drawing, used for the floor reflection
    cutiefly: "assets/images/cutiefly.webp",
    greeting: "Hey! I'm Brandon 👋",               // speech bubble when hovering over you
    greetingGirl: "Hire him!",                     // speech bubble when hovering over her
    // short intro shown at the top of Experience (edit freely)
    about: "I'm a Security Analyst who keeps a credit union one step ahead of the people trying to break in. I build security governance, writing the policies, standards and rules that define how we operate, then engineer the controls that enforce them.",
    personal: "Away from the screen, I'm a husband and a dad first.",   // shown under the About text (not in the recruiter summary)
    updated: "2026-10-25",                         // shown in the footer as "Last updated"
    photo: "assets/images/headshot.webp",          // About-me portrait (swap in a sharper original anytime)
    builds: ["Cloud Honeypot & Threat Research", "Network-wide DNS Filtering", "Enterprise-Style Network Rack", "Cloud Security Monitoring Homelab"],  // project chips under About me
    location: "Greater Orlando, FL",
    // verified highlights shown in the strip at the top of Experience
    impact: [
      { value: "24h", label: "Critical & zero-day remediation SLA" },
      { value: "220+", label: "Employees onboarded through a merger" },
      { value: "150+", label: "Locations supported" },
      { value: "Since 2021", label: "Building in IT & security" }
    ],
    bonus: {                                       // secret card: type ↑ ↑ ↓ ↓ ← → ← → B A on the title screen
      title: "Bonus Memory",
      text: "You found the secret! Fun fact: I build my own home lab for fun. Thanks for exploring this far — let's talk."
    },
    memory: {                                      // card that opens when the art is clicked
      title: "My Wife & I",
      heart: true,                                 // a drawn black heart after the title
      photo: "assets/images/memory-wife.webp",
      text: ""
    }
  },

  /* ---------------------------------------------------------
     EXPERIENCE — the gold timeline, oldest first.
     Use to: "present" for your current role. Leave `to` out
     for a single date (e.g. graduation) and set `dateLabel`.
     --------------------------------------------------------- */
  experience: [
    {
      role: "IT Help Desk Technician",
      short: "Help Desk",
      company: "Advanced Dermatology and Cosmetic Surgery",
      logo: "assets/images/logos/advderm.png",
      from: "2021-12", to: "2022-07",
      summary: "Frontline support across a 150+ location healthcare organization, where I built the fundamentals of identity, endpoint and access management.",
      highlights: [
        "Delivered onsite and remote support for 150+ locations, resolving endpoint, application, account, printing, scanning and connectivity issues",
        "Consistently exceeded productivity targets, resolving 40–50 tickets per day without sacrificing quality",
        "Imaged and deployed hundreds of Windows endpoints, handling domain onboarding, application installs and production-readiness validation",
        "Administered Active Directory and Group Policy, processed administrative privilege requests and provisioned VPN access",
        "Served on the acquisition team that built out IT infrastructure for newly acquired locations: deploying workstations and printers, building and cable-managing network racks, and bringing sites to production readiness",
        "Authored knowledge-base articles and technical documentation that standardized troubleshooting across the team"
      ],
      skills: ["Active Directory", "Group Policy", "Windows Imaging", "VPN Provisioning", "Privileged Access Requests", "Documentation"],
      stats: [{ value: "150+", label: "Locations supported" }, { value: "40–50", label: "Tickets resolved per day" }, { value: "100s", label: "Windows endpoints imaged" }]
    },
    {
      role: "Head of Collections & IT Support",
      short: "Collections & IT",
      company: "All Roofing & Construction",
      logo: "assets/images/logos/allroofing.png",
      from: "2022-07", to: "2025-03",
      summary: "Owned the collections department and the office's IT as a two-person front office with the owner: I needed to know everyone's job, and no one else knew mine.",
      highlights: [
        "Owned collections end to end: billing, invoicing, estimates, payment plans, insurance claims and the lien process",
        "Collected over $350,000 in a single week, processing cash, card and wire payments with receipts for every transaction",
        "Protected customer financial and personal data across a paper-based workflow",
        "Ran the office's IT support: computers, printers and phones",
        "Built the company file system and wrote training documents covering every role's order of operations",
        "Served as the company notary, meeting customers at their homes, and earned 100+ five-star reviews through customer service",
        "Served as the company graphic designer and video editor, producing marketing visuals in Adobe Photoshop and Premiere Pro and documenting every build with drone before-and-after footage",
        "Handled all office calls and walk-in customers"
      ],
      stats: [{ value: "$350K+", label: "Collected in one week" }, { value: "100+", label: "Five-star reviews" }, { value: "Every", label: "Role documented" }],
      skills: ["Collections", "Billing & Invoicing", "Payment Processing", "Insurance Claims", "Lien Process", "Notary Public", "Technical Support", "Process Documentation", "Data Protection", "Graphic Design", "Adobe Photoshop", "Adobe Premiere Pro", "Drone Documentation", "Customer Service"]
    },
    {
      role: "Associate of Science (A.S.) & Technical Certificate",
      short: "A.S. Degree",
      company: "Seminole State College",
      logo: "assets/images/logos/seminole.png",
      from: "2023-05",
      dateLabel: "Graduated May 2023",
      summary: "Earned my Associate of Science and a Technical Certificate while building hands-on networking and security skills in the lab, and made the President's List multiple times along the way.",
      highlights: [
        "Earned an Associate of Science (A.S.) and a Technical Certificate",
        "Named to the President's List multiple times for academic excellence",
        "Built hands-on networking and security skills through Cisco Packet Tracer and Linux labs"
      ],
      stats: [{ value: "A.S.", label: "Degree earned" }, { value: "+1", label: "Technical Certificate" }, { value: "Multiple", label: "President's List honors" }],
      skills: ["Networking Fundamentals", "Cisco Packet Tracer", "Linux"]
    },
    {
      role: "IT Technician",
      short: "IT Technician",
      company: "Addition Financial Credit Union",
      logo: "assets/images/logos/addition.png",
      from: "2025-03", to: "2026-10",
      summary: "Kept a regulated financial institution's endpoints, identities and core banking platforms secure and running through one of Florida's largest credit union mergers.",
      highlights: [
        "Supported one of Florida's largest credit union mergers: 12+ departmental restructures, 7 branch integrations and onboarding of 220+ employees with operations uninterrupted",
        "Responded to endpoint threats end to end: triaged EDR detections, investigated suspicious activity and drove cases to resolution",
        "Monitored and investigated security events in the SIEM, correlating telemetry to separate real threats from noise",
        "Remediated critical and zero-day vulnerabilities within 24 hours using CrowdStrike Falcon and ManageEngine Patch Manager, maintaining full SLA compliance",
        "Reviewed vulnerability cases and advisories to determine exposure across our environment and prioritized remediation by risk",
        "Automated patching and endpoint policy enforcement with Automox and ManageEngine, from OS deployment to device monitoring",
        "Administered KnowBe4 security awareness and enforced policy training compliance across the workforce",
        "Audited endpoints, inactive accounts, access permissions and system configurations to strengthen compliance and reduce organizational risk",
        "Governed identity and access across Active Directory, Microsoft Entra ID, Azure and Microsoft 365, enforcing least privilege through onboarding, offboarding and privilege management",
        "Led incident communications during outages, documenting impact, publishing stakeholder updates and coordinating resolution",
        "Served on the company Summit Committee as IT lead, hardening event devices and running A/V for the first all-company gathering since the merger",
        "Tracked threat intelligence and cybersecurity news to anticipate emerging threats before they reach our environment"
      ],
      stats: [{ value: "24h", label: "Critical & zero-day remediation" }, { value: "220+", label: "Employees onboarded in a merger" }, { value: "7", label: "Branch integrations" }, { value: "12+", label: "Departmental restructures" }],
      skills: ["Endpoint Threat Response", "CrowdStrike Falcon", "SIEM", "Vulnerability Management", "Automox", "KnowBe4", "ManageEngine", "Microsoft Entra ID", "Active Directory", "Azure", "Microsoft 365", "IAM", "Security Auditing", "Incident Communications"]
    },
    {
      role: "Security Analyst",
      short: "Security Analyst",
      company: "Addition Financial Credit Union",
      logo: "assets/images/logos/addition.png",
      location: "Greater Orlando, FL",
      from: "2026-10", to: "present",
      summary: "Defending a regulated financial institution day to day, from hunting threats and patching zero-days to training the people who keep it secure, with our risk metrics held below enterprise averages.",
      highlights: [
        "Lead threat hunting and incident investigation across SIEM alerts, case reports and CrowdStrike Falcon detections, driving every case from triage to containment and closure",
        "Own critical and zero-day vulnerability remediation through Automox and ManageEngine, authoring custom scripts that automate patch deployment across the enterprise",
        "Run adversary simulation with Picus Security to penetration test the environment, exposing control gaps and validating fixes before attackers can exploit them",
        "Serve as Proofpoint administrator investigating user-reported phishing through Exchange, and run KnowBe4 phishing campaigns that sharpen employee detection",
        "Monitor managed and unmanaged networks for inactive assets, compromised passwords and machines missing baseline encryption, driving every gap to remediation",
        "Govern identity in Microsoft Entra ID and harden systems through Group Policy enforcement",
        "Keep phishing and vulnerability metrics below enterprise averages by leading security awareness training, publishing weekly security briefings and conducting daily threat research",
        "Author security policies, standards and configuration baselines, then enforce them across endpoints, identity and the network"
      ],
      stats: [{ value: "24h", label: "Zero-day remediation" }, { value: "Below", label: "Enterprise-average risk metrics" }, { value: "Weekly", label: "Security articles published" }],
      skills: ["Threat Hunting", "SIEM", "CrowdStrike Falcon", "Automox", "ManageEngine", "Patch Scripting", "Picus Security", "Proofpoint", "Exchange", "KnowBe4", "Phishing Analysis", "Asset Management", "Credential Hygiene", "Microsoft Entra ID", "Group Policy", "Identity Management", "Security Awareness", "Security Governance"]
    }
  ],

  /* ---------------------------------------------------------
     PROJECT WORK — shown as collectible cards (in this order).
     type:   a category label (cards are colored by type)
     icon:   shield, lock, key, terminal, network, cloud, eye, bug
     status: "complete" or "active"
     --------------------------------------------------------- */
  projects: [
    {
      title: "Security Governance Framework",
      type: "Governance", icon: "shield", status: "active", date: "2026-10",
      featured: true,
      summary: "Turning security requirements into clear policies, enforceable rules and measurable compliance.",
      problem: "A regulated financial institution needs security expectations that are written down, enforceable and auditable, not just tribal knowledge.",
      approach: "I author security policies and standards, translate them into concrete technical rules and configuration baselines across endpoints, identity and the network, then audit systems and access against them to measure compliance and close gaps.",
      // Add a sanitized result here when you're ready (no confidential details), e.g. what improved after the rules went in.
      result: "",
      controls: ["Written policies & standards", "Technical baselines", "Access reviews", "Compliance audits"],
      tools: ["Security Policy", "Standards & Baselines", "Firewall & Access Rules", "Compliance Auditing", "Risk Management", "Security Awareness"],
      images: [], links: []
    },
    {
      title: "Cloud Security Monitoring Homelab",
      type: "Security Monitoring", icon: "cloud", status: "complete", date: "",
      summary: "A cloud-hosted monitoring stack that centralizes endpoint telemetry, network health and security events, with AI-generated alert summaries.",
      description: [
        "Built a homelab on Microsoft Azure and VMware running Ubuntu Linux and Docker to mirror how a security team centralizes visibility.",
        "Deployed Wazuh for endpoint telemetry and security event collection, NetAlertX for network asset discovery, and Grafana dashboards to visualize network health.",
        "Integrated AI-driven alert summarization so security events arrive as clear, actionable context instead of raw logs."
      ],
      tools: ["Azure", "VMware", "Ubuntu Linux", "Docker", "Wazuh", "NetAlertX", "Grafana", "AI Alert Summarization"],
      images: [], links: []
    },
    {
      title: "Cloud Honeypot & Threat Research",
      type: "Threat Research", icon: "eye", status: "complete",
      summary: "An internet-facing Linux honeypot for studying real attacker behavior and inbound traffic patterns.",
      description: [
        "Deployed and port-forwarded a Linux-based honeypot to capture live inbound attack traffic.",
        "Analyzed the captured traffic and logs for threat detection practice, and investigated indicators with open-source tools including CyberChef, SpiderFoot and Kibana."
      ],
      problem: "Colleagues challenged me to build a working honeypot and see who on the internet would come knocking.",
      approach: "Deployed T-Pot (Hive) on a Linux VM in Microsoft Azure, then wrote virtual firewall rules to deliberately expose the services I wanted attacked, including decoys on non-standard ports. I investigated the captured traffic with T-Pot's attack map, CyberChef, Kibana and SpiderFoot.",
      result: "Within hours the live attack map was tracking 100+ connection attempts from known attackers and mass scanners across the US, Europe and beyond, probing Telnet and other exposed services: real attacker behavior to study, not textbook examples.",
      controls: ["Isolated cloud VM", "Deliberate firewall exposure", "Decoy services on non-standard ports", "Threat-intel enrichment"],
      tools: ["Microsoft Azure", "T-Pot (Hive)", "Linux", "Firewall Rules", "Kibana", "CyberChef", "SpiderFoot", "Threat Intelligence"],
      images: [{ src: "assets/images/projects/tpot-attack-map.webp", caption: "Live T-Pot attack map: 125 attacks in 24 hours from known attackers and mass scanners" }, { src: "assets/images/projects/tpot-dashboard.webp", caption: "T-Pot dashboard with Attack Map, CyberChef, Elasticvue, Kibana and SpiderFoot" }, { src: "assets/images/projects/tpot-install.webp", caption: "Building the honeypot on web-server-honey" }],
      date: "2026-09", links: []
    },
    {
      title: "Network-wide DNS Filtering",
      type: "Network Security", icon: "shield", status: "complete", date: "2026-10",
      summary: "Pi-hole on a Raspberry Pi 5 filtering DNS for every device on my network.",
      problem: "I wanted visibility into, and control over, what every device on my network was reaching out to.",
      approach: "Deployed Pi-hole on a Raspberry Pi 5 as the network's DNS resolver, so every query is logged and checked against blocklists before it resolves.",
      result: "Network-level ad and tracker blocking for every device, with full query visibility: about 10.8% of queries blocked (4,319 of 39,868) in the period shown. Next step: integrating AI into the analysis.",
      controls: ["DNS blocklists", "Central DNS resolver", "Query logging"],
      tools: ["Pi-hole", "Raspberry Pi 5", "DNS", "Network Monitoring", "Blocklists"],
      images: [{ src: "assets/images/projects/pihole-dashboard.webp", caption: "Pi-hole dashboard: 39,868 queries from 11 clients, 4,319 blocked against 79,541 listed domains" }, { src: "assets/images/projects/pihole-pi.webp", caption: "The Raspberry Pi running Pi-hole, glowing in the rack" }],
      links: []
    },
    {
      title: "Network Segmentation & Secure DNS",
      type: "Network Security", icon: "lock", status: "complete", date: "",
      summary: "Segmented my network with VLANs and 802.1Q trunking and stood up a self-hosted DNS service for visibility.",
      description: [
        "Configured VLAN segmentation on OpenWRT with 802.1Q trunking, and managed switch configurations directly through the CLI.",
        "Deployed cloud-accessible NAS storage and built a Raspberry Pi DNS service to improve network performance and visibility into DNS traffic."
      ],
      controls: ["VLAN segmentation", "802.1Q trunking", "Self-hosted DNS"],
      tools: ["OpenWRT", "VLANs", "802.1Q", "Switch CLI", "Raspberry Pi", "DNS", "NAS"],
      images: [{ src: "assets/images/projects/vlan-switch.webp", caption: "VLAN-segmented ports on the managed switch, trunked down to the Raspberry Pi DNS server" }, { src: "assets/images/projects/rack-desk.webp", caption: "The workstation and rack: testing connectivity across the segmented network" }], links: []
    },
    {
      title: "Enterprise-Style Network Rack",
      type: "Infrastructure", icon: "network", status: "complete", date: "2026-10",
      summary: "A 6U rack-mounted environment that simulates enterprise infrastructure practices at home.",
      description: [
        "Designed and deployed a 6U rack with a 24-port patch panel, two 16-port Ubiquiti managed switches, a Synology NAS, a PDU and UPS protection.",
        "Ran structured cabling and centralized network services to practice enterprise-grade infrastructure and power resilience."
      ],
      tools: ["Ubiquiti", "Synology NAS", "Patch Panel", "UPS / PDU", "Structured Cabling", "Raspberry Pi"],
      images: [{ src: "assets/images/projects/rack.webp", caption: "Today: Synology DS225+ NAS, 24-port Cat6A patch panel, Ubiquiti managed switch, Raspberry Pi, KVM and PDU" }, { src: "assets/images/projects/rack-v1.webp", caption: "Where it started: the first build with a PoE managed switch and patch panel" }], links: []
    },
    {
      title: "Cisco Network Hardening Labs",
      type: "Network Security", icon: "shield", status: "complete", date: "",
      summary: "Advanced Cisco Packet Tracer labs focused on segmentation, routing and device hardening.",
      description: [
        "Completed labs covering router hardening, VLANs, inter-VLAN routing, router-on-a-stick deployments, SSH administration, CDP, port security, loopback interfaces and static routes."
      ],
      controls: ["Port security", "SSH-only management", "Router hardening", "Inter-VLAN routing"],
      tools: ["Cisco Packet Tracer", "Router Hardening", "Port Security", "SSH", "Inter-VLAN Routing", "Static Routing"],
      images: [], links: []
    },
    {
      title: "Hardened Modded Minecraft Server",
      type: "Systems Administration", icon: "terminal", status: "complete", date: "2026-10",
      summary: "A public-facing Ubuntu game server run like production: access controls, backups and remote administration.",
      problem: "Run a public-facing, modded game server safely on repurposed hardware.",
      approach: "Upgraded my dad's old laptop with more storage and RAM, installed Ubuntu, and managed it with Webmin (health monitoring) and CubeCoders AMP. Exposed it securely through Playit.gg port forwarding and proxying, locked access down with a firewall, a whitelist and role-based access controls, and administered it over SSH.",
      result: "A stable server running like production: scheduled backups, log review, Java runtime management and resource tuning, with security built in from day one.",
      controls: ["Firewall & whitelist", "Role-based access", "SSH administration", "Scheduled backups", "Tunneled exposure via Playit.gg"],
      tools: ["Ubuntu Server", "Webmin", "CubeCoders AMP", "Playit.gg", "Firewall & Whitelist", "RBAC", "SSH", "Scheduled Backups"],
      images: [{ src: "assets/images/projects/minecraft-world.webp", caption: "The server's world at night" }, { src: "assets/images/projects/minecraft-build.webp", caption: "An in-game tech workshop built by the community" }, { src: "assets/images/projects/minecraft-laptop.webp", caption: "Upgrading the repurposed laptop's RAM and storage to host it" }, { src: "assets/images/projects/minecraft-amp.webp", caption: "The server listing, powered by AMP" }],
      links: []
    }
    ,{
      title: "Company Summit: IT Lead",
      type: "Leadership", icon: "key", status: "complete", date: "2026-10",
      summary: "IT lead on the Summit Committee for the first all-company event since the merger.",
      problem: "Bring all of Addition Financial under one roof for the first time since the merger, with zero technical surprises.",
      approach: "Supported IT across a cross-departmental committee: hardened event devices, ran A/V and presentation equipment, and helped manage the event. We held weekly breakdown meetings, met every deadline and built backup plans in case anything failed.",
      result: "A smooth event for the whole company, \"One Team, One Rhythm\", and hands-on experience in device hardening, A/V and event management.",
      controls: ["Device hardening", "Backup plans for every system"],
      tools: ["Device Hardening", "A/V Systems", "Event Management", "Cross-team Leadership", "Contingency Planning"],
      images: [{ src: "assets/images/projects/summit-hall.webp", caption: "Main hall set up for the all-company session" }, { src: "assets/images/projects/summit-stage.webp", caption: "A breakout room I set up: projectors, speakers and signed-in presenter devices" }, { src: "assets/images/projects/summit-selfie.webp", caption: "Me at the Summit: One Team. One Rhythm.", pos: "50% 52%" }, { src: "assets/images/projects/summit-sign.webp", caption: "Wayfinding projection for the breakout sessions" }],
      links: []
    }
  ],

  /* ---------------------------------------------------------
     CERTIFICATIONS
     tier:   "foundational" | "associate" | "professional" | "expert"
     status: "earned" or "in progress"
     date:   earned date (or target date while in progress)
     verify: link to the issuer's verification page (optional)
     document: path to a PDF/scan of the certificate (optional)
     --------------------------------------------------------- */
  certifications: [
    {
      title: "CompTIA Network+", issuer: "CompTIA", tier: "foundational", status: "in progress", date: "",
      description: "Validates networking fundamentals: infrastructure, network operations, troubleshooting and core network security.",
      verify: "", document: "", images: []
    },
    {
      title: "CompTIA Security+", issuer: "CompTIA", tier: "foundational", status: "in progress", date: "",
      description: "Validates core cybersecurity skills: threats and vulnerabilities, security architecture, identity and access management, and incident response.",
      verify: "", document: "", images: []
    },
    {
      title: "CrowdStrike Certified Falcon Administrator (CCFA)", issuer: "CrowdStrike", tier: "associate", status: "in progress", date: "",
      description: "Covers administering the CrowdStrike Falcon platform: sensor deployment, prevention policies, host management and console configuration.",
      verify: "", document: "", images: []
    },
    {
      title: "CrowdStrike Certified Falcon Practitioner (CCFP)", issuer: "CrowdStrike", tier: "foundational", status: "in progress", date: "",
      description: "Validates practical, hands-on knowledge of the CrowdStrike Falcon platform.",
      verify: "", document: "", images: []
    },
    {
      title: "GitHub Foundations", issuer: "GitHub", tier: "foundational", status: "in progress", date: "",
      description: "Covers core Git and GitHub concepts: repositories, collaboration workflows and the GitHub platform.",
      verify: "", document: "", images: []
    },
    {
      title: "Microsoft Information Security Administrator Associate (SC-401)", issuer: "Microsoft", tier: "associate", status: "in progress", date: "",
      description: "Covers protecting information in Microsoft 365: information protection, data loss prevention and insider risk management.",
      verify: "", document: "", images: []
    },
    {
      title: "PowerShell, Microsoft Graph & Picus Onboarding", issuer: "Professional training", tier: "foundational", status: "in progress", date: "",
      description: "Hands-on onboarding in PowerShell and Microsoft Graph automation alongside the Picus breach and attack simulation platform.",
      verify: "", document: "", images: []
    }
  ]
};
