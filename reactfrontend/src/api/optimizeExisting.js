import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000' || 'http://f1quantumpfopt.dev.ryzeai.ai';

export const optimizeExistingPortfolio = async (portfolioRequest) => {
    try {
        console.log('Forwarding request to optimize existing portfolio:', portfolioRequest);

        const response = await axios.post(`${BACKEND_URL}/optimize-existing`, portfolioRequest, {
            timeout: 120000, // 2-minute timeout
        });

        if (response.data && 'error' in response.data) {
            throw new Error(response.data.error);
        }

        return response.data;

    } catch (error) {
        console.error('API Call Error in optimize-existing:', error);
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Backend service is unavailable.');
            }
            if (error.response) {
                throw new Error(error.response.data.detail || 'Backend processing failed.');
            }
            if (error.code === 'ECONNABORTED') {
                throw new Error('Optimization timeout. The request took too long.');
            }
        }
        throw new Error(error.message || 'An internal server error occurred.');
    }
};