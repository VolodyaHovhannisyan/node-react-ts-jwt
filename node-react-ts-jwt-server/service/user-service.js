const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {

    async registration(email, password) {
        const candidate = await UserModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest(`User with ${email} already exists`)
        }
        const hashedPassword = await bcrypt.hash(password, 3)
        const activationLink = uuid.v4()

        const user = await UserModel.create({ email, password: hashedPassword, activationLink })
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return { ...tokens, user: userDto }

    }

    async activate(activationLink) {

        const user = await UserModel.findOne({ activationLink })
        if (!user) {
            throw ApiError.BadRequest('Wrong activation link provided')
        }
        user.isActivated = true
        await user.save()
    }

    async login(email, password) {
        const user = await UserModel.findOne({ email })
        if (!user) {
            throw ApiError.BadRequest('User with this email does not exists')
        }
        const isPassEquals = await bcrypt.compare(password, user.password)
        if (!isPassEquals) {
            throw ApiError.BadRequest('Password is invalid')
        }

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return { ...tokens, user: userDto }
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken)
        return token
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError()
        }

        const userData = await tokenService.validateRefreshToken(refreshToken)
        // const tokenFromDb = await tokenService.findToken(refreshToken)
        // console.log('Token from Db', tokenFromDb);
        // if (!userData || !tokenFromDb) {
        if (!userData) {
            throw ApiError.UnauthorizedError()
        }

        const user = await UserModel.findById(userData.id)
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({ ...userDto })
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return { ...tokens, user: userDto }
    }

    async getAllUsers() {
        const users = await UserModel.find()
        return users
    }
}

module.exports = new UserService()