import { SecretRule } from './types';
import { shannonEntropy, isLikelyPlaceholder } from './entropy';

/**
 * Built-in (free tier) detection rules. Patterns are intentionally specific to
 * keep false positives low; the generic-high-entropy rule is the catch-all and
 * is gated behind entropy + placeholder checks.
 */
export const builtInRules: SecretRule[] = [
  {
    id: 'aws-access-key-id',
    name: 'AWS Access Key ID',
    description: 'Amazon Web Services access key identifier.',
    severity: 'critical',
    tier: 'free',
    pattern: /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|ANPA|ANVA)[0-9A-Z]{16}\b/g,
  },
  {
    id: 'aws-secret-access-key',
    name: 'AWS Secret Access Key',
    description: 'Amazon Web Services secret access key (contextual).',
    severity: 'critical',
    tier: 'free',
    group: 1,
    pattern: /aws_secret_access_key["']?\s*[:=]\s*["']?([A-Za-z0-9/+]{40})/gi,
  },
  {
    id: 'github-token',
    name: 'GitHub Token',
    description: 'GitHub personal access / OAuth / app token.',
    severity: 'critical',
    tier: 'free',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  },
  {
    id: 'github-fine-grained-pat',
    name: 'GitHub Fine-grained PAT',
    description: 'GitHub fine-grained personal access token.',
    severity: 'critical',
    tier: 'free',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
  },
  {
    id: 'gitlab-pat',
    name: 'GitLab Personal Access Token',
    description: 'GitLab personal access token.',
    severity: 'critical',
    tier: 'free',
    pattern: /\bglpat-[A-Za-z0-9_-]{20}\b/g,
  },
  {
    id: 'google-api-key',
    name: 'Google API Key',
    description: 'Google / Firebase API key.',
    severity: 'high',
    tier: 'free',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: 'slack-token',
    name: 'Slack Token',
    description: 'Slack API token.',
    severity: 'critical',
    tier: 'free',
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,72}\b/g,
  },
  {
    id: 'slack-webhook',
    name: 'Slack Webhook URL',
    description: 'Slack incoming webhook URL.',
    severity: 'high',
    tier: 'free',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9A-Za-z]+/g,
  },
  {
    id: 'stripe-secret-key',
    name: 'Stripe Secret Key',
    description: 'Stripe secret or restricted key.',
    severity: 'critical',
    tier: 'free',
    pattern: /\b(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{16,}\b/g,
  },
  {
    id: 'openai-key',
    name: 'OpenAI API Key',
    description: 'OpenAI API key.',
    severity: 'critical',
    tier: 'free',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: 'sendgrid-key',
    name: 'SendGrid API Key',
    description: 'SendGrid API key.',
    severity: 'critical',
    tier: 'free',
    pattern: /\bSG\.[A-Za-z0-9_-]{16,32}\.[A-Za-z0-9_-]{16,64}\b/g,
  },
  {
    id: 'twilio-api-key',
    name: 'Twilio API Key',
    description: 'Twilio API key (SK...).',
    severity: 'high',
    tier: 'free',
    pattern: /\bSK[0-9a-fA-F]{32}\b/g,
  },
  {
    id: 'npm-token',
    name: 'npm Access Token',
    description: 'npm access token.',
    severity: 'critical',
    tier: 'free',
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
  },
  {
    id: 'private-key-block',
    name: 'Private Key Block',
    description: 'PEM-encoded private key header.',
    severity: 'critical',
    tier: 'free',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
  },
  {
    id: 'jwt',
    name: 'JSON Web Token',
    description: 'A JWT (header.payload.signature).',
    severity: 'medium',
    tier: 'free',
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  },
  {
    id: 'basic-auth-url',
    name: 'Credentials in URL',
    description: 'Username:password embedded in a URL.',
    severity: 'high',
    tier: 'free',
    group: 1,
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:([^\s:@/]+)@/gi,
    validate: (value) => !isLikelyPlaceholder(value),
  },
  {
    id: 'generic-high-entropy',
    name: 'Generic High-Entropy Secret',
    description: 'A high-entropy value assigned to a secret-like identifier.',
    severity: 'medium',
    tier: 'free',
    group: 2,
    pattern:
      /(?<![\w.$])([A-Za-z_$][\w$]*(?:secret|token|apikey|api_key|password|passwd|pwd|access_key|accesskey|auth|client_secret|private_key)[\w$]*)\s*[:=]\s*["'`]([^"'`\n]{12,})["'`]/gi,
    validate: (value, _ctx, options) => {
      if (isLikelyPlaceholder(value)) {
        return false;
      }
      if (/\s/.test(value)) {
        return false;
      }
      const looksEncoded = /^[A-Za-z0-9+/_-]{12,}={0,2}$/.test(value);
      if (!looksEncoded) {
        return false;
      }
      const threshold = options.entropyThreshold ?? 3.5;
      return shannonEntropy(value) >= threshold;
    },
  },
];
