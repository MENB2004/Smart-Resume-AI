import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Resume } from '../types/resume';

export const pdfService = {
  async generateAndSharePDF(resume: Resume) {
    const htmlContent = generateHTML(resume);

    try {
      if (Platform.OS === 'web') {
        const win = typeof window !== 'undefined' ? window : null;
        if (win) {
          const printWindow = win.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            // A brief timeout ensures fonts/styles load completely
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
            }, 300);
          } else {
            alert('Please allow popups to export your resume.');
          }
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `${resume.personalInfo.fullName || 'Resume'}_ATS_Resume.pdf`,
            UTI: 'com.adobe.pdf'
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate or share PDF', error);
      throw error;
    }
  }
};

const generateHTML = (resume: Resume) => {
  const isFresher = resume.level === 'fresher';
  const pageMargin = isFresher ? '45px' : '55px';
  const bodyFontSize = isFresher ? '10.5pt' : '11pt';
  const bodyLineHeight = isFresher ? '1.2' : '1.4';
  const h1FontSize = isFresher ? '20pt' : '28pt';
  const h1Margin = isFresher ? '0 0 4px 0' : '0 0 10px 0';
  const headerLineMarginTop = isFresher ? '4px' : '8px';
  const headerLineMarginBottom = isFresher ? '8px' : '15px';
  const sectionTitleFontSize = isFresher ? '12pt' : '14pt';
  const sectionTitleMarginTop = isFresher ? '8px' : '15px';
  const sectionTitleMarginBottom = isFresher ? '3px' : '5px';
  const liMarginBottom = isFresher ? '2px' : '4px';

  const name = resume.personalInfo.fullName || 'Your Name';
  const email = resume.personalInfo.email || '';
  const phone = resume.personalInfo.phone || '';
  const linkedin = resume.personalInfo.linkedin || '';
  const github = resume.personalInfo.github || '';
  const portfolio = resume.personalInfo.portfolio || '';

  const parseNestedBullets = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.map(line => `<li>${line.trim().replace(/^- /, '').replace(/^• /, '')}</li>`).join('');
  };

  // Determine template parameters
  const tpl = resume.templateId || 'classic';
  let fontCSS = "font-family: 'Times New Roman', Times, serif;";
  let primaryColor = "#000000";
  let secondaryColor = "#333333";
  let extraCSS = "";

  if (tpl === 'modern') {
    fontCSS = "font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;";
    primaryColor = "#2563eb";
    secondaryColor = "#4b5563";
    extraCSS = `
      .header-line { border-bottom: 3px solid ${primaryColor}; border-radius: 2px; }
      .section-title { text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
    `;
  } else if (tpl === 'minimal') {
    fontCSS = "font-family: 'Georgia', Times, serif;";
    primaryColor = "#111827";
    secondaryColor = "#374151";
    extraCSS = `
      .header-line { border-bottom: 1px solid ${primaryColor}; }
      .section-title { font-style: italic; border-bottom: none; }
    `;
  } else if (tpl === 'student') {
    fontCSS = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;";
    primaryColor = "#059669";
    secondaryColor = "#0f766e";
    extraCSS = `
      .header-line { border-bottom: 2px solid ${primaryColor}; }
      .section-title { font-weight: 800; border-left: 4px solid ${primaryColor}; padding-left: 8px; }
    `;
  } else if (tpl === 'developer') {
    fontCSS = "font-family: 'Courier New', Courier, monospace;";
    primaryColor = "#7c3aed";
    secondaryColor = "#6d28d9";
    extraCSS = `
      .header-line { border-bottom: 2px dashed ${primaryColor}; }
      .section-title { font-weight: bold; }
      .section-title::before { content: "[ "; color: ${primaryColor}; }
      .section-title::after { content: " ]"; color: ${primaryColor}; }
    `;
  } else {
    // classic
    extraCSS = `
      .header-line { border-bottom: 2px double #000000; }
    `;
  }

  // Set up modular section renderers
  const sectionRenderers: Record<string, () => string> = {
    personalInfo: () => `
      <h1>${name}</h1>
      <div class="contact-info">
        <div class="contact-left">
          ${email ? `Email: <a href="mailto:${email}">${email}</a>` : ''}
          ${email && phone ? '&nbsp;&nbsp;&bull;&nbsp;&nbsp;' : ''}
          ${phone ? `Phone: ${phone}` : ''}
        </div>
        <div class="contact-right">
          ${[
            linkedin && `<a href="${linkedin}">${linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a>`,
            github && `<a href="${github}">${github.replace(/^https?:\/\/(www\.)?/, '')}</a>`,
            portfolio && `<a href="${portfolio}">${portfolio.replace(/^https?:\/\/(www\.)?/, '')}</a>`
          ].filter(Boolean).join('&nbsp;&nbsp;&bull;&nbsp;&nbsp;')}
        </div>
      </div>
      <div class="header-line"></div>
    `,
    summary: () => resume.personalInfo.summary ? `
      <div class="section-title">Professional Summary</div>
      <p class="summary-text">${resume.personalInfo.summary}</p>
    ` : '',
    skills: () => resume.skills && resume.skills.some(cat => cat.items.length > 0) ? `
      <div class="section-title">Core Skills</div>
      <ul class="skills-list">
        ${resume.skills.filter(cat => cat.items.length > 0).map(cat => `
          <li><strong>${cat.category}:</strong> ${cat.items.join(', ')}</li>
        `).join('')}
      </ul>
    ` : '',
    education: () => resume.education && resume.education.length > 0 ? `
      <div class="section-title">Education</div>
      <ul class="education-list">
        ${resume.education.map(edu => `
          <li>
            <strong>${edu.degree}</strong>${edu.cgpa ? ` (CGPA: ${edu.cgpa})` : ''}<br/>
            ${edu.institution}, ${edu.year}
          </li>
        `).join('')}
      </ul>
    ` : '',
    experience: () => resume.experience && resume.experience.length > 0 ? `
      <div class="section-title">Work Experience</div>
      <ul class="experience-list">
        ${resume.experience.map(exp => `
          <li>
            <strong>${exp.role}</strong> – ${exp.company} ${exp.duration ? `(${exp.duration})` : ''}
            <ul class="nested">
              ${parseNestedBullets(exp.description)}
            </ul>
          </li>
        `).join('')}
      </ul>
    ` : '',
    projects: () => resume.projects && resume.projects.length > 0 ? `
      <div class="section-title">Projects</div>
      <ul class="projects-list">
        ${resume.projects.map(proj => {
          const techPart = proj.techStack ? ` | <em>${proj.techStack}</em>` : '';
          const bulletsList = proj.bullets && proj.bullets.length > 0 
            ? proj.bullets.map(b => `<li>${b}</li>`).join('')
            : parseNestedBullets(proj.description);
          return `
            <li>
              <strong>${proj.title}</strong>${techPart}
              <ul class="nested">
                ${bulletsList}
              </ul>
            </li>
          `;
        }).join('')}
      </ul>
    ` : '',
    certifications: () => resume.certifications && resume.certifications.length > 0 ? `
      <div class="section-title">Certifications</div>
      <ul class="certifications-list">
        ${resume.certifications.map(cert => `
          <li>${cert.name}</li>
        `).join('')}
      </ul>
    ` : '',
    achievements: () => resume.achievements && resume.achievements.length > 0 ? `
      <div class="section-title">Achievements & Extracurriculars</div>
      <ul class="achievements-list">
        ${resume.achievements.map(ach => `
          <li>${ach}</li>
        `).join('')}
      </ul>
    ` : '',
    languages: () => (resume.level !== 'fresher' && resume.languages && resume.languages.length > 0) ? `
      <div class="section-title">Languages</div>
      <p class="languages-text">${resume.languages.join(', ')}</p>
    ` : '',
  };

  // Add coursework
  if (resume.coursework && resume.coursework.length > 0) {
    sectionRenderers['coursework'] = () => `
      <div class="section-title">Relevant Coursework</div>
      <p class="coursework-text">${resume.coursework!.join(', ')}</p>
    `;
  }

  // Register custom sections
  if (resume.customSections) {
    resume.customSections.forEach(sec => {
      sectionRenderers[sec.id] = () => `
        <div class="section-title">${sec.title}</div>
        <p class="custom-text">${sec.content}</p>
      `;
    });
  }

  // Determine dynamic visual render ordering
  const defaultSectionsOrder = isFresher
    ? ['personalInfo', 'summary', 'skills', 'education', 'projects', 'experience', 'coursework', 'certifications', 'achievements']
    : ['personalInfo', 'summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'achievements', 'languages'];

  const order = resume.sectionsOrder && resume.sectionsOrder.length > 0
    ? resume.sectionsOrder
    : defaultSectionsOrder;

  // Render order loop
  let renderedHTML = '';
  order.forEach(sectionId => {
    if (sectionRenderers[sectionId]) {
      renderedHTML += sectionRenderers[sectionId]();
    }
  });

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: ${pageMargin}; }
          body { 
            ${fontCSS}
            color: #000; 
            line-height: ${bodyLineHeight}; 
            padding: 0; 
            margin: 0;
            font-size: ${bodyFontSize};
            text-align: justify;
          }
          h1 { 
            font-size: ${h1FontSize}; 
            margin: ${h1Margin}; 
            font-weight: bold;
            color: ${primaryColor};
            text-align: left;
          }
          .contact-info { 
            font-size: 10pt; 
            color: ${secondaryColor};
            display: flex;
            justify-content: space-between;
            align-items: center;
            line-height: 1.6;
          }
          .contact-info a {
            color: ${secondaryColor};
            text-decoration: none;
          }
          .contact-left, .contact-right {
            white-space: nowrap;
          }
          .header-line {
            margin-top: ${headerLineMarginTop};
            margin-bottom: ${headerLineMarginBottom};
          }
          .section-title { 
            font-size: ${sectionTitleFontSize}; 
            color: ${primaryColor}; 
            font-weight: bold;
            margin-top: ${sectionTitleMarginTop}; 
            margin-bottom: ${sectionTitleMarginBottom};
            text-align: left; 
          }
          ul { 
            margin: 0; 
            padding-left: 24px; 
          }
          ul.nested {
            padding-left: 28px;
            margin-top: 2px;
          }
          li {
            margin-bottom: ${liMarginBottom};
          }
          p {
            margin: 0;
          }
          ${isFresher ? `
          /* Strictly enforce single page constraint for freshers */
          html, body {
            max-height: 100%;
            height: 100%;
            overflow: hidden;
          }
          @media print {
            html, body {
              max-height: 100vh;
              height: 100vh;
              overflow: hidden;
              page-break-inside: avoid;
            }
          }
          ` : ''}
          ${extraCSS}
        </style>
      </head>
      <body>
        <div id="resume-root">
          ${renderedHTML}
        </div>
        <script>
          window.addEventListener('load', () => {
            const isFresher = ${isFresher};
            if (!isFresher) return;
            
            const wrapper = document.getElementById('resume-root');
            if (!wrapper) return;
            
            const TARGET_HEIGHT = 1030; 
            let fontSize = 10.0;
            let attempts = 0;
            
            while (wrapper.scrollHeight > TARGET_HEIGHT && fontSize > 7.2 && attempts < 40) {
              fontSize -= 0.1;
              document.body.style.fontSize = fontSize + 'pt';
              
              const h1 = document.querySelector('h1');
              if (h1) {
                h1.style.fontSize = (fontSize * 2) + 'pt';
              }
              
              const sectionTitleMargin = Math.max(3, fontSize - 3);
              const sectionTitleFontSize = fontSize + 2;
              document.querySelectorAll('.section-title').forEach(el => {
                el.style.marginTop = sectionTitleMargin + 'px';
                el.style.fontSize = sectionTitleFontSize + 'pt';
              });
              
              const liMargin = Math.max(1, fontSize - 8);
              document.querySelectorAll('li').forEach(el => {
                el.style.marginBottom = liMargin + 'px';
              });
              
              attempts++;
            }
          });
        </script>
      </body>
    </html>
  `;
};
