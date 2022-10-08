export const truncateString = (str: string, max = 7) => {
	if (str.length > max) {
		return str.substring(0, max) + '...';
	} else {
		return str;
	}
};
