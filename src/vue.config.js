module.exports = {
    configureWebpack: config => {
        return {
            module: {
                rules: [
                    {
                        test: /\.(md|txt)$/,
                        use: 'raw-loader'
                    },
                    {
                        test: /\.less$/,
                        use: 'less-loader'
                    }
                ]
            }
        }
    }
}