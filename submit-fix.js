function getSubmissionEndpoint() {
  if (window.SIGN_GUY_SUBMISSION_ENDPOINT) return window.SIGN_GUY_SUBMISSION_ENDPOINT;
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/submit-design', window.location.href).href;
}

async function submitDesignRequest() {
  if (!state.processed || !state.uploadedFile) return;
  setStatus('Submitting');
  els.submitDesign.disabled = true;
  try {
    const endpoint = getSubmissionEndpoint();
    const screenshots = await captureSubmissionScreenshots();
    const subject = SUBMISSION_SUBJECT;
    const body = makeEmailBody();

    if (endpoint) {
      await submitDesignToEndpoint({ endpoint, subject, body, screenshots });
      setStatus('Submitted');
      els.submitNote.textContent = `Submitted to ${CONTACT_EMAIL} with the logo and ${screenshots.length} visualizer screenshots.`;
      return;
    }

    screenshots.forEach((item) => downloadBlob(item.blob, item.file.name, 'image/png'));
    openMailDraft(subject, `${body}\n\nAttach the uploaded logo file and the downloaded visualizer screenshots before sending.`);
    els.submitNote.textContent = 'This local file cannot email directly. A pre-addressed email draft was opened and the visualizer screenshots were downloaded.';
    setStatus('Email draft');
  } catch (error) {
    console.error(error);
    els.submitNote.textContent = describeSubmitError(error);
    setStatus('Submit failed');
  } finally {
    els.submitDesign.disabled = false;
  }
}

async function submitDesignToEndpoint({ endpoint, subject, body, screenshots }) {
  const form = new FormData();
  form.append('to', CONTACT_EMAIL);
  form.append('subject', subject);
  form.append('message', body);
  form.append('signName', getDesignName());
  form.append('uploadedFileName', state.fileName || state.uploadedFile?.name || 'logo file');
  form.append('size', SIZE_PRESETS[state.size].label);
  form.append('depthMm', String(SIZE_PRESETS[state.size].depth));
  form.append('sideColour', normalizeHex(state.shellColours.side));
  form.append('backColour', normalizeHex(state.shellColours.back));
  form.append('frontColours', JSON.stringify((state.processed?.colours || []).map((region, idx) => getDisplayColour(idx, region.hex))));
  form.append('logo', state.uploadedFile, state.uploadedFile.name || 'uploaded-logo');
  screenshots.forEach((shot, idx) => {
    form.append(`renderScreenshot${idx + 1}`, shot.file, shot.file.name);
    form.append(`renderScreenshot${idx + 1}Label`, shot.label);
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    let message = `Submission endpoint returned ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // Keep the HTTP status message when the endpoint does not return JSON.
    }
    throw new Error(message);
  }
}

function describeSubmitError(error) {
  const message = String(error?.message || '');
  if (message.includes('SMTP is not configured')) {
    return 'Email is not configured yet. Add the SMTP environment variables in Vercel, then redeploy.';
  }
  if (message.includes('3D preview is not ready') || message.includes('screenshot')) {
    return 'Could not prepare the screenshots. Please try again after the preview finishes loading.';
  }
  return 'Could not send this submission. Check the email service settings and try again.';
}
