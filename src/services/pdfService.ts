import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Resume } from '../types/resume';

export const pdfService = {
  async generateAndSharePDF(resume: Resume) {
    const htmlContent = generateHTML(resume);

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${resume.personalInfo.fullName || 'Resume'}_ATS_Resume.pdf`,
          UTI: 'com.adobe.pdf'
        });
      }
    } catch (error) {
      console.error('Failed to generate or share PDF', error);
      throw error;
    }
  }
};

const generateHTML = (resume: Resume) => {
  const name = resume.personalInfo.fullName || 'Your Name';
  const email = resume.personalInfo.email || '';
  const phone = resume.personalInfo.phone || '';
  const linkedin = resume.personalInfo.linkedin || '';
  const github = resume.personalInfo.github || '';
  const portfolio = resume.personalInfo.portfolio || '';
  
  const contactParts = [
    email && `Email: <a href="mailto:${email}">${email}</a>`, 
    phone && `Phone: ${phone}`, 
    linkedin && `LinkedIn: <a href="${linkedin}">${linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a>`, 
    github && `GitHub: <a href="${github}">${github.replace(/^https?:\/\/(www\.)?/, '')}</a>`,
    portfolio && `Portfolio: <a href="${portfolio}">${portfolio.replace(/^https?:\/\/(www\.)?/, '')}</a>`
  ].filter(Boolean);
  
  const contactString = contactParts.join(' | ');

  const parseNestedBullets = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.map(line => `<li>${line.trim().replace(/^- /, '').replace(/^• /, '')}</li>`).join('');
  };

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 40px; }
          body { 
            font-family: 'Times New Roman', Times, serif; 
            color: #000; 
            line-height: 1.4; 
            padding: 0; 
            margin: 0;
            font-size: 11pt;
            text-align: justify;
          }
          h1 { 
            font-size: 28pt; 
            margin: 0 0 10px 0; 
            font-weight: bold;
            color: #000;
            text-align: left;
          }
          .contact-info { 
            font-size: 10pt; 
            color: #111;
            text-align: left;
          }
          .contact-info a {
            color: #111;
            text-decoration: none;
          }
          .header-line {
            border-bottom: 2px solid #3b5998;
            margin-top: 8px;
            margin-bottom: 15px;
          }
          .section-title { 
            font-size: 14pt; 
            color: #3b5998; 
            font-weight: bold;
            margin-top: 15px; 
            margin-bottom: 5px;
            text-align: left; 
          }
          ul { 
            margin: 0; 
            padding-left: 30px; 
          }
          ul.nested {
            padding-left: 40px;
            margin-top: 2px;
          }
          li {
            margin-bottom: 4px;
          }
          p {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <h1>${name}</h1>
        <div class="contact-info">${contactString}</div>
        <div class="header-line"></div>
        
        ${resume.personalInfo.summary ? `
          <div class="section-title">Professional Summary</div>
          <p>${resume.personalInfo.summary}</p>
        ` : ''}

        ${resume.skills && resume.skills.some(cat => cat.items.length > 0) ? `
          <div class="section-title">Skills</div>
          <ul>
            ${resume.skills.filter(cat => cat.items.length > 0).map(cat => `
              <li>${cat.category}: ${cat.items.join(', ')}</li>
            `).join('')}
          </ul>
        ` : ''}

        ${resume.level === 'fresher' ? (resume.education && resume.education.length > 0 ? `
          <div class="section-title">Education</div>
          <ul>
            ${resume.education.map(edu => `
              <li>
                ${edu.degree}${edu.cgpa ? ` (CGPA: ${edu.cgpa})` : ''}<br/>
                ${edu.institution}, ${edu.year}
              </li>
            `).join('')}
          </ul>
        ` : '') : ''}

        ${resume.level === 'experienced' ? (resume.experience && resume.experience.length > 0 ? `
          <div class="section-title">Experience</div>
          <ul>
          ${resume.experience.map(exp => `
            <li>
              ${exp.role} – ${exp.company} ${exp.duration ? `(${exp.duration})` : ''}
              <ul class="nested">
                ${parseNestedBullets(exp.description)}
              </ul>
            </li>
          `).join('')}
          </ul>
        ` : '') : ''}

        ${resume.projects && resume.projects.length > 0 ? `
          <div class="section-title">Projects</div>
          <ul>
          ${resume.projects.map(proj => `
            <li>
              ${proj.title}
              <ul class="nested">
                ${parseNestedBullets(proj.description)}
              </ul>
            </li>
          `).join('')}
          </ul>
        ` : ''}

        ${resume.level === 'fresher' ? (resume.experience && resume.experience.length > 0 ? `
          <div class="section-title">Experience</div>
          <ul>
          ${resume.experience.map(exp => `
            <li>
              ${exp.role} – ${exp.company} ${exp.duration ? `(${exp.duration})` : ''}
              <ul class="nested">
                ${parseNestedBullets(exp.description)}
              </ul>
            </li>
          `).join('')}
          </ul>
        ` : '') : ''}

        ${resume.level === 'experienced' ? (resume.education && resume.education.length > 0 ? `
          <div class="section-title">Education</div>
          <ul>
            ${resume.education.map(edu => `
              <li>
                ${edu.degree}${edu.cgpa ? ` (CGPA: ${edu.cgpa})` : ''}<br/>
                ${edu.institution}, ${edu.year}
              </li>
            `).join('')}
          </ul>
        ` : '') : ''}

        ${resume.certifications && resume.certifications.length > 0 ? `
          <div class="section-title">Certifications</div>
          <ul>
            ${resume.certifications.map(cert => `
              <li>${cert.name}</li>
            `).join('')}
          </ul>
        ` : ''}

        ${resume.achievements && resume.achievements.length > 0 ? `
          <div class="section-title">Achievements / Extracurriculars</div>
          <ul>
            ${resume.achievements.map(ach => `
              <li>${ach}</li>
            `).join('')}
          </ul>
        ` : ''}

        ${resume.languages && resume.languages.length > 0 ? `
          <div class="section-title">Languages</div>
          <p>${resume.languages.join(', ')}</p>
        ` : ''}
      </body>
    </html>
  `;
};
