import { item } from './item.js'

/*
  Stack (COPY.md 3.5): one line, middle dots between groups. The chips are
  aria-hidden; screen readers get the one sentence.
*/

export const STACK = {
  sentence: item(
    'stack-sentence',
    'Java, TypeScript, JavaScript, Python, C++, SQL · React, Next.js, Node.js, Spring Boot, Tailwind · AWS, PostgreSQL, Supabase, Firebase, MongoDB, Kafka, GraphQL · AI agents and multi-agent systems, Claude Code daily · AWS Certified Cloud Practitioner',
    ['sk-languages', 'sk-frameworks', 'sk-cloud-data', 'sk-ai', 'edu-cert-aws-ccp'],
  ),
  rows: [
    { id: 'stack-languages', chips: ['Java', 'TypeScript', 'JavaScript', 'Python', 'C++', 'SQL'], facts: ['sk-languages'] },
    { id: 'stack-frameworks', chips: ['React', 'Next.js', 'Node.js', 'Spring Boot', 'Tailwind'], facts: ['sk-frameworks'] },
    { id: 'stack-cloud', chips: ['AWS', 'PostgreSQL', 'Supabase', 'Firebase', 'MongoDB', 'Kafka', 'GraphQL'], facts: ['sk-cloud-data'] },
    { id: 'stack-ai', chips: ['AI agents and multi-agent systems', 'Claude Code daily'], facts: ['sk-ai'] },
    { id: 'stack-cert', chips: ['AWS Certified Cloud Practitioner'], facts: ['edu-cert-aws-ccp'] },
  ],
}
