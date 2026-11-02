export const isWorthIndexing = (ticket) => {
    const isValid = (`${ticket?.title} ${ticket?.description}`).trim().split(/\s+/).filter(Boolean).length > 10;
    return isValid;
}

export const isWorthSummaryIndexing = (problem) => {
    const isValid = problem.trim().split(/\s+/).filter(Boolean).length > 10;
    return isValid;
}